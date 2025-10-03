/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'lucide-react' {
  export const Bell: any;
  export const BellRing: any;
  export const Bot: any;
  export const Calendar: any;
  export const Check: any;
  export const CheckCircle2: any;
  export const ChevronDown: any;
  export const Clock: any;
  export const Dumbbell: any;
  export const Edit: any;
  export const ExternalLink: any;
  export const Eye: any;
  export const EyeOff: any;
  export const FileText: any;
  export const Home: any;
  export const Instagram: any;
  export const Layers: any;
  export const Link: any;
  export const Linkedin: any;
  export const Mail: any;
  export const MapPin: any;
  export const MessageSquare: any;
  export const MoreVertical: any;
  export const Phone: any;
  export const Pill: any;
  export const Plus: any;
  export const Settings: any;
  export const Share2: any;
  export const ShieldCheck: any;
  export const Smartphone: any;
  export const Sparkles: any;
  export const ArrowRight: any;
  export const Trash2: any;
  export const Trophy: any;
  export const Twitter: any;
  export const UserPlus: any;
  export const Users: any;
  export const X: any;
}

declare module 'date-fns' {
  export function format(date: Date | string, formatStr: string): string;
  export function parseISO(dateString: string): Date;
  export function addDays(date: Date, amount: number): Date;
  export function startOfDay(date: Date): Date;
  export function endOfDay(date: Date): Date;
  export function isSameDay(dateLeft: Date, dateRight: Date): boolean;
}

declare module 'googleapis';
declare module 'next/navigation';
declare module 'next/link';
declare module 'next/server';
declare module 'next/headers';
declare module 'next/image';
declare module 'next/font/google';
declare module 'next';

declare module 'embla-carousel-react' {
  export default function useEmblaCarousel(options?: any, plugins?: any[]): [any, any];
}

declare module '@/components/ui/avatar' {
  export const Avatar: any;
  export const AvatarImage: any;
  export const AvatarFallback: any;
}

declare module '@/components/ui/card' {
  export const Card: any;
  export const CardContent: any;
}

declare module '@/components/ui/3d-testimonials' {
  export const Marquee: any;
}
