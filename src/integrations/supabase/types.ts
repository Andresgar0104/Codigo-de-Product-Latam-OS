export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          country: string | null
          domain: string | null
          id: string
          industry: string | null
          name: string
          size: string | null
          workspaceId: string
        }
        Insert: {
          country?: string | null
          domain?: string | null
          id: string
          industry?: string | null
          name: string
          size?: string | null
          workspaceId: string
        }
        Update: {
          country?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          name?: string
          size?: string | null
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          companyId: string | null
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          lastTouch: string | null
          linkedin: string | null
          name: string | null
          tags: string[] | null
          title: string | null
          workspaceId: string
        }
        Insert: {
          companyId?: string | null
          email?: string | null
          firstName?: string | null
          id: string
          lastName?: string | null
          lastTouch?: string | null
          linkedin?: string | null
          name?: string | null
          tags?: string[] | null
          title?: string | null
          workspaceId: string
        }
        Update: {
          companyId?: string | null
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          lastTouch?: string | null
          linkedin?: string | null
          name?: string | null
          tags?: string[] | null
          title?: string | null
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_fk"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          contactId: string
          createdAt: string
          id: string
          stage: string
          value: number | null
          workspaceId: string
        }
        Insert: {
          contactId: string
          createdAt: string
          id: string
          stage: string
          value?: number | null
          workspaceId: string
        }
        Update: {
          contactId?: string
          createdAt?: string
          id?: string
          stage?: string
          value?: number | null
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_fk"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attributes: {
        Row: {
          createdAt: string
          eventId: string
          id: string
          label: string
          value: string
        }
        Insert: {
          createdAt?: string
          eventId: string
          id: string
          label: string
          value?: string
        }
        Update: {
          createdAt?: string
          eventId?: string
          id?: string
          label?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attributes_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_contacts: {
        Row: {
          contactId: string
          createdAt: string
          eventId: string
          id: string
          role: string
          status: string
        }
        Insert: {
          contactId: string
          createdAt?: string
          eventId: string
          id: string
          role?: string
          status?: string
        }
        Update: {
          contactId?: string
          createdAt?: string
          eventId?: string
          id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_contacts_contactId_fkey"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_contacts_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_partners: {
        Row: {
          companyId: string
          createdAt: string
          eventId: string
          id: string
          role: string
        }
        Insert: {
          companyId: string
          createdAt?: string
          eventId: string
          id: string
          role?: string
        }
        Update: {
          companyId?: string
          createdAt?: string
          eventId?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_partners_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          audienciaObjetivo: string | null
          city: string | null
          cohosts: number | null
          cover: string | null
          date: string | null
          descripcion: string | null
          formato: string | null
          id: string
          landingUrl: string | null
          name: string
          outreach: string | null
          registrations: number | null
          speakers: number | null
          status: string | null
          target: number | null
          time: string | null
          venueId: string | null
          workspaceId: string
        }
        Insert: {
          audienciaObjetivo?: string | null
          city?: string | null
          cohosts?: number | null
          cover?: string | null
          date?: string | null
          descripcion?: string | null
          formato?: string | null
          id: string
          landingUrl?: string | null
          name: string
          outreach?: string | null
          registrations?: number | null
          speakers?: number | null
          status?: string | null
          target?: number | null
          time?: string | null
          venueId?: string | null
          workspaceId: string
        }
        Update: {
          audienciaObjetivo?: string | null
          city?: string | null
          cohosts?: number | null
          cover?: string | null
          date?: string | null
          descripcion?: string | null
          formato?: string | null
          id?: string
          landingUrl?: string | null
          name?: string
          outreach?: string | null
          registrations?: number | null
          speakers?: number | null
          status?: string | null
          target?: number | null
          time?: string | null
          venueId?: string | null
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_workspace_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          createdAt: string
          email: string
          id: string
          isOwner: boolean
          name: string
          role: string
          status: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
          isOwner?: boolean
          name?: string
          role?: string
          status?: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          isOwner?: boolean
          name?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          dueDate: string | null
          eventId: string
          id: string
          priority: string | null
          status: string
          title: string | null
        }
        Insert: {
          dueDate?: string | null
          eventId: string
          id: string
          priority?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          dueDate?: string | null
          eventId?: string
          id?: string
          priority?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_fk"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      touchpoints: {
        Row: {
          channel: string
          contactId: string
          date: string
          id: string
          note: string | null
        }
        Insert: {
          channel: string
          contactId: string
          date: string
          id: string
          note?: string | null
        }
        Update: {
          channel?: string
          contactId?: string
          date?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "touchpoints_contact_fk"
            columns: ["contactId"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          ciudad: string | null
          contactoPrincipal: Json | null
          googleMapsUrl: string | null
          id: string
          imageUrl: string | null
          name: string
          notes: string | null
          workspaceId: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          ciudad?: string | null
          contactoPrincipal?: Json | null
          googleMapsUrl?: string | null
          id: string
          imageUrl?: string | null
          name: string
          notes?: string | null
          workspaceId: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          ciudad?: string | null
          contactoPrincipal?: Json | null
          googleMapsUrl?: string | null
          id?: string
          imageUrl?: string | null
          name?: string
          notes?: string | null
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_workspace_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          client: string
          color: string
          icp: string | null
          id: string
          name: string
        }
        Insert: {
          client: string
          color: string
          icp?: string | null
          id: string
          name: string
        }
        Update: {
          client?: string
          color?: string
          icp?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_team_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
