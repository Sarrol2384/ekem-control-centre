export type UserRole = 'manager' | 'staff'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          employee_code: string
          full_name: string
          position: string | null
          department: string | null
          employment_status: 'active' | 'inactive' | 'archived'
          start_date: string | null
          contact_number: string | null
          email: string | null
          address: string | null
          profile_photo_url: string | null
          emergency_contact_name: string | null
          emergency_contact_relationship: string | null
          emergency_contact_number: string | null
          notes: string | null
          annual_leave_entitlement: number | null
          is_demo: boolean
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          employee_code: string
          full_name: string
          position?: string | null
          department?: string | null
          employment_status?: 'active' | 'inactive' | 'archived'
          start_date?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          profile_photo_url?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_number?: string | null
          notes?: string | null
          annual_leave_entitlement?: number | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          employee_code?: string
          full_name?: string
          position?: string | null
          department?: string | null
          employment_status?: 'active' | 'inactive' | 'archived'
          start_date?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          profile_photo_url?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_number?: string | null
          notes?: string | null
          annual_leave_entitlement?: number | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          id: string
          employee_id: string
          title: string
          document_type:
            | 'employment_contract'
            | 'identification'
            | 'qualification'
            | 'professional_registration'
            | 'training_certificate'
            | 'other'
          document_date: string | null
          expiry_date: string | null
          storage_path: string | null
          reference_code: string | null
          notes: string | null
          uploaded_by: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          title: string
          document_type:
            | 'employment_contract'
            | 'identification'
            | 'qualification'
            | 'professional_registration'
            | 'training_certificate'
            | 'other'
          document_date?: string | null
          expiry_date?: string | null
          storage_path?: string | null
          reference_code?: string | null
          notes?: string | null
          uploaded_by?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          title?: string
          document_type?:
            | 'employment_contract'
            | 'identification'
            | 'qualification'
            | 'professional_registration'
            | 'training_certificate'
            | 'other'
          document_date?: string | null
          expiry_date?: string | null
          storage_path?: string | null
          reference_code?: string | null
          notes?: string | null
          uploaded_by?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late' | 'on_leave'
          arrival_time: string | null
          departure_time: string | null
          notes: string | null
          recorded_by: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late' | 'on_leave'
          arrival_time?: string | null
          departure_time?: string | null
          notes?: string | null
          recorded_by?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          attendance_date?: string
          status?: 'present' | 'absent' | 'late' | 'on_leave'
          arrival_time?: string | null
          departure_time?: string | null
          notes?: string | null
          recorded_by?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: 'annual' | 'sick' | 'family_responsibility' | 'other'
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          start_date: string
          end_date: string
          days_count: number
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: 'annual' | 'sick' | 'family_responsibility' | 'other'
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          start_date: string
          end_date: string
          days_count: number
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: 'annual' | 'sick' | 'family_responsibility' | 'other'
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          start_date?: string
          end_date?: string
          days_count?: number
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_records: {
        Row: {
          id: string
          employee_id: string
          training_name: string
          provider: string | null
          training_date: string | null
          expiry_date: string | null
          certificate_reference: string | null
          status: 'valid' | 'due' | 'expiring_soon' | 'expired'
          notes: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          training_name: string
          provider?: string | null
          training_date?: string | null
          expiry_date?: string | null
          certificate_reference?: string | null
          status?: 'valid' | 'due' | 'expiring_soon' | 'expired'
          notes?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          training_name?: string
          provider?: string | null
          training_date?: string | null
          expiry_date?: string | null
          certificate_reference?: string | null
          status?: 'valid' | 'due' | 'expiring_soon' | 'expired'
          notes?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_employee_id: string | null
          created_by: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'todo' | 'in_progress' | 'completed'
          completed_at: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_employee_id?: string | null
          created_by?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'todo' | 'in_progress' | 'completed'
          completed_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_employee_id?: string | null
          created_by?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'todo' | 'in_progress' | 'completed'
          completed_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_activity: {
        Row: {
          id: string
          task_id: string
          actor_id: string | null
          action: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          actor_id?: string | null
          action: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          actor_id?: string | null
          action?: string
          details?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          is_read: boolean
          link_path: string | null
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      demo_sales: {
        Row: {
          id: string
          metric_date: string
          period: string
          amount: number
          transaction_count: number
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      demo_prescriptions: {
        Row: {
          id: string
          metric_date: string
          processed_count: number
          pending_count: number
          completed_count: number
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      demo_inventory: {
        Row: {
          id: string
          product_name: string
          sku: string | null
          quantity_on_hand: number
          minimum_level: number
          stock_value: number
          expiry_date: string | null
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      demo_suppliers: {
        Row: {
          id: string
          supplier_name: string
          outstanding_orders: number
          pending_deliveries: number
          outstanding_invoices: number
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_manager: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: Record<string, never>
  }
}
