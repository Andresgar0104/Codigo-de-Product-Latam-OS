// Types and constants. Data lives in Supabase now (see deals-context.tsx).

export type Stage =
  | "contacted"
  | "engaged"
  | "meeting"
  | "proposal"
  | "won"
  | "lost";

export type TouchpointChannel = "Email" | "LinkedIn" | "Call" | "WhatsApp" | "Meeting" | "Evento" | "Notas";

export interface Workspace {
  id: string;
  name: string;
  client: string;
  color: string;
  icp: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  country: string;
  workspaceId: string;
}

export interface Contact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title: string;
  email: string;
  linkedin: string;
  companyId: string;
  workspaceId: string;
  tags: string[];
  lastTouch: string;
}

export type EventContactStatus = "registrado" | "asistio" | "no_show";
export type EventContactRole = "asistente" | "speaker" | "cohost";

export interface EventContact {
  id: string;
  eventId: string;
  contactId: string;
  status: EventContactStatus;
  role: EventContactRole;
  createdAt?: string;
}

export const EVENT_CONTACT_STATUS_LABEL: Record<EventContactStatus, string> = {
  registrado: "Registrado",
  asistio: "Asistió",
  no_show: "No-show",
};

export const EVENT_CONTACT_ROLE_LABEL: Record<EventContactRole, string> = {
  asistente: "Asistente",
  speaker: "Speaker",
  cohost: "Co-host",
};


export interface Event {
  id: string;
  name: string;
  date: string;
  time?: string;
  city: string;
  registrations: number;
  target: number;
  status: "upcoming" | "live" | "past";
  cover: string;
  workspaceId: string;
  formato?: string;
  audienciaObjetivo?: string;
  outreach?: string;
  cohosts?: number;
  speakers?: number;
  landingUrl?: string;
  descripcion?: string;
  venueId?: string;
}

export interface Touchpoint {
  id: string;
  contactId: string;
  channel: TouchpointChannel;
  date: string;
  note: string;
}

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "keep_in_mind" | "importante" | "urgente";

export interface Task {
  id: string;
  eventId: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}


export interface Venue {
  id: string;
  workspaceId: string;
  name: string;
  address: string;
  capacity: number;
  imageUrl?: string;
  notes?: string;
  ciudad?: string;
  googleMapsUrl?: string;
  contactoPrincipal?: { nombre: string; email: string; telefono: string };
}

export interface Deal {
  id: string;
  contactId: string;
  workspaceId: string;
  stage: Stage;
  value?: number;
  createdAt: string;
}

export interface EventAttribute {
  id: string;
  eventId: string;
  label: string;
  value: string;
  createdAt?: string;
}

export type EventPartnerRole = "cohost" | "sponsor";

export interface EventPartner {
  id: string;
  eventId: string;
  companyId: string;
  role: EventPartnerRole;
  createdAt?: string;
}

export const TAG_OPTIONS = [
  "Asistió a evento",
  "Panelista",
  "Co-host",
  "Speaker invitado",
  "Sponsor",
  "Lead frío",
  "Lead caliente",
];

export const stageOrder: Stage[] = ["contacted", "engaged", "meeting", "proposal", "won", "lost"];
export const ACTIVE_STAGES: Stage[] = ["contacted", "engaged", "meeting", "proposal", "won"];
export const stageLabels: Record<Stage, string> = {
  contacted: "Contacted",
  engaged: "Engaged",
  meeting: "Meeting",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};
