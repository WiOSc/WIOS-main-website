export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "time",
  "phone",
  "url",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_LABELS: Record<FieldType, string> = {
  short_text: "Short text",
  long_text: "Paragraph",
  email: "Email",
  number: "Number",
  select: "Dropdown",
  radio: "Single choice",
  checkbox: "Multiple choice",
  date: "Date",
  time: "Time",
  phone: "Phone",
  url: "URL",
};

export const OPTION_TYPES: FieldType[] = ["select", "radio", "checkbox"];

export interface FormField {
  id: string;
  globalId: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export interface FieldLibraryItem {
  globalId: string;
  label: string;
  type: FieldType;
  options?: string[];
  suggestedId: string;
  usedIn: number;
}

export type EventStatus = "draft" | "open" | "closed";

export interface EventTheme {
  accent: string;
  poster?: string;
  layout: "centered" | "split";
}

export interface EventImage {
  url: string;
  key: string;
  alt?: string;
  uploadedAt?: string;
}

export interface EventDoc {
  id?: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  showOnEvents?: boolean;
  date?: string;
  venue?: string;
  category?: string;
  images?: EventImage[];
  bannerUrl?: string;
  location?: string;
  startsAt?: string;
  registrationDeadline?: string;
  allowEdit: boolean;
  status: EventStatus;
  theme: EventTheme;
  fields: FormField[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSeeded?: boolean;
}

export interface Registration {
  uid: string;
  email: string;
  name: string | null;
  photoURL: string | null;
  answers: Record<string, string | string[]>;
  createdAt: string;
  updatedAt?: string;
}

// Open if status is open and the deadline has not passed
export function isRegistrationOpen(event: EventDoc, now: number = Date.now()): boolean {
  if (event.status !== "open") return false;
  if (event.registrationDeadline) {
    const deadline = new Date(event.registrationDeadline).getTime();
    if (!Number.isNaN(deadline) && now > deadline) return false;
  }
  return true;
}
