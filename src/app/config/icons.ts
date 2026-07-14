/**
 * Icon Configuration
 * 
 * Centralized icon management using lucide-react icon library.
 * This file maps icon names to their lucide-react components for consistent usage across the app.
 */

import {
  // Navigation Icons
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  
  // Action Icons
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Send,
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  
  // Social Media Icons
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  
  // Service Icons
  Sparkles,
  Star,
  Heart,
  Gift,
  Award,
  TrendingUp,
  Users,
  Shield,
  
  // UI Icons
  Search,
  Filter,
  Settings,
  MoreVertical,
  MoreHorizontal,
  Plus,
  Minus,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Download,
  Upload,
  Share2,
  
  // Status Icons
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  
  // Payment Icons
  CreditCard,
  DollarSign,
  Tag,
  
  // Misc Icons
  Home,
  User,
  LogIn,
  LogOut,
  BookOpen,
  Briefcase,
  Camera,
} from 'lucide-react';

export const icons = {
  // Navigation
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  
  // Actions
  calendar: Calendar,
  clock: Clock,
  mapPin: MapPin,
  phone: Phone,
  mail: Mail,
  send: Send,
  check: Check,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
  info: Info,
  
  // Social Media
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  
  // Services
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  gift: Gift,
  award: Award,
  trendingUp: TrendingUp,
  users: Users,
  shield: Shield,
  
  // UI
  search: Search,
  filter: Filter,
  settings: Settings,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash,
  eye: Eye,
  eyeOff: EyeOff,
  download: Download,
  upload: Upload,
  share: Share2,
  
  // Status
  loader: Loader2,
  refresh: RefreshCw,
  checkCircle2: CheckCircle2,
  xCircle: XCircle,
  alertTriangle: AlertTriangle,
  
  // Payment
  creditCard: CreditCard,
  dollarSign: DollarSign,
  tag: Tag,
  
  // Misc
  home: Home,
  user: User,
  logIn: LogIn,
  logOut: LogOut,
  bookOpen: BookOpen,
  briefcase: Briefcase,
  camera: Camera,
};

export type IconName = keyof typeof icons;
