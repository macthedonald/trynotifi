import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { supabase } from '@/lib/database/supabase'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id || session.client_reference_id

        if (!userId) {
          console.error('No user_id in checkout session')
          break
        }

        // Update user with Stripe customer ID and subscription info
        await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer as string,
            plan: getPlanFromSession(session),
            subscription_id: session.subscription as string,
            subscription_status: 'active',
          })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!user) {
          console.error('User not found for customer:', customerId)
          break
        }

        // Update subscription status
        await supabase
          .from('users')
          .update({
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            plan: getPlanFromSubscription(subscription),
          })
          .eq('id', user.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!user) {
          console.error('User not found for customer:', customerId)
          break
        }

        // Downgrade to free plan
        await supabase
          .from('users')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', user.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded for invoice:', invoice.id)
        // You can add logic here to send payment confirmation emails
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', invoice.id)
        // You can add logic here to handle payment failures
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper functions to determine plan from Stripe objects
function getPlanFromSession(session: Stripe.Checkout.Session): string {
  // Extract plan from session metadata or line items
  return session.metadata?.plan || 'pro'
}

function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  // Extract plan from subscription metadata
  const priceId = subscription.items.data[0]?.price.id

  // Match price ID to plan
  if (priceId?.includes('team')) return 'team'
  if (priceId?.includes('pro')) return 'pro'

  return 'free'
}
