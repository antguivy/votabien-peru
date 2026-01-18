export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      alliancecomposition: {
        Row: {
          child_org_id: string | null;
          created_at: string;
          id: string;
          parent_org_id: string | null;
          process_id: string | null;
        };
        Insert: {
          child_org_id?: string | null;
          created_at?: string;
          id: string;
          parent_org_id?: string | null;
          process_id?: string | null;
        };
        Update: {
          child_org_id?: string | null;
          created_at?: string;
          id?: string;
          parent_org_id?: string | null;
          process_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alliance_composition_child_org_id_fkey";
            columns: ["child_org_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alliance_composition_parent_org_id_fkey";
            columns: ["parent_org_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alliance_composition_process_id_fkey";
            columns: ["process_id"];
            isOneToOne: false;
            referencedRelation: "electoralprocess";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendancestatus"];
          created_at: string;
          date: string;
          id: string;
          legislator_id: string;
          notes: string | null;
          session_type: Database["public"]["Enums"]["sessiontype"];
          updated_at: string;
        };
        Insert: {
          attendance_status: Database["public"]["Enums"]["attendancestatus"];
          created_at: string;
          date: string;
          id: string;
          legislator_id: string;
          notes?: string | null;
          session_type: Database["public"]["Enums"]["sessiontype"];
          updated_at: string;
        };
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendancestatus"];
          created_at?: string;
          date?: string;
          id?: string;
          legislator_id?: string;
          notes?: string | null;
          session_type?: Database["public"]["Enums"]["sessiontype"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_legislator_id_fkey";
            columns: ["legislator_id"];
            isOneToOne: false;
            referencedRelation: "legislator";
            referencedColumns: ["id"];
          },
        ];
      };
      background: {
        Row: {
          created_at: string;
          id: string;
          person_id: string;
          publication_date: string | null;
          sanction: string | null;
          source: string;
          source_url: string | null;
          status: Database["public"]["Enums"]["backgroundstatus"];
          summary: string | null;
          title: string;
          type: Database["public"]["Enums"]["backgroundtype"];
          updated_at: string;
        };
        Insert: {
          created_at: string;
          id: string;
          person_id: string;
          publication_date?: string | null;
          sanction?: string | null;
          source: string;
          source_url?: string | null;
          status: Database["public"]["Enums"]["backgroundstatus"];
          summary?: string | null;
          title: string;
          type: Database["public"]["Enums"]["backgroundtype"];
          updated_at: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          person_id?: string;
          publication_date?: string | null;
          sanction?: string | null;
          source?: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["backgroundstatus"];
          summary?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["backgroundtype"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "background_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      bill: {
        Row: {
          approval_date: string | null;
          approval_status: Database["public"]["Enums"]["billapprovalstatus"];
          coauthors: string | null;
          committees: string | null;
          cosponsors: string | null;
          created_at: string;
          document_url: string | null;
          id: string;
          legislative_session: string | null;
          legislator_id: string;
          number: string;
          parliamentary_group_id: string | null;
          period: string | null;
          sponsor: string | null;
          submission_date: string;
          summary: string | null;
          title: string | null;
          title_ai: string | null;
          updated_at: string;
        };
        Insert: {
          approval_date?: string | null;
          approval_status?: Database["public"]["Enums"]["billapprovalstatus"];
          coauthors?: string | null;
          committees?: string | null;
          cosponsors?: string | null;
          created_at: string;
          document_url?: string | null;
          id: string;
          legislative_session?: string | null;
          legislator_id: string;
          number: string;
          parliamentary_group_id?: string | null;
          period?: string | null;
          sponsor?: string | null;
          submission_date: string;
          summary?: string | null;
          title?: string | null;
          title_ai?: string | null;
          updated_at: string;
        };
        Update: {
          approval_date?: string | null;
          approval_status?: Database["public"]["Enums"]["billapprovalstatus"];
          coauthors?: string | null;
          committees?: string | null;
          cosponsors?: string | null;
          created_at?: string;
          document_url?: string | null;
          id?: string;
          legislative_session?: string | null;
          legislator_id?: string;
          number?: string;
          parliamentary_group_id?: string | null;
          period?: string | null;
          sponsor?: string | null;
          submission_date?: string;
          summary?: string | null;
          title?: string | null;
          title_ai?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bill_legislator_id_fkey";
            columns: ["legislator_id"];
            isOneToOne: false;
            referencedRelation: "legislator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_parliamentary_group_id_fkey";
            columns: ["parliamentary_group_id"];
            isOneToOne: false;
            referencedRelation: "parliamentarygroup";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate: {
        Row: {
          created_at: string;
          electoral_district_id: string | null;
          electoral_process_id: string;
          government_plan__url: string | null;
          id: string;
          list_number: number | null;
          person_id: string;
          political_party_id: string;
          proposals: string | null;
          status: Database["public"]["Enums"]["candidacystatus"];
          type: Database["public"]["Enums"]["candidacytype"];
          updated_at: string;
          votes_obtained: number | null;
          was_elected: boolean;
        };
        Insert: {
          created_at: string;
          electoral_district_id?: string | null;
          electoral_process_id: string;
          government_plan__url?: string | null;
          id: string;
          list_number?: number | null;
          person_id: string;
          political_party_id: string;
          proposals?: string | null;
          status: Database["public"]["Enums"]["candidacystatus"];
          type: Database["public"]["Enums"]["candidacytype"];
          updated_at: string;
          votes_obtained?: number | null;
          was_elected: boolean;
        };
        Update: {
          created_at?: string;
          electoral_district_id?: string | null;
          electoral_process_id?: string;
          government_plan__url?: string | null;
          id?: string;
          list_number?: number | null;
          person_id?: string;
          political_party_id?: string;
          proposals?: string | null;
          status?: Database["public"]["Enums"]["candidacystatus"];
          type?: Database["public"]["Enums"]["candidacytype"];
          updated_at?: string;
          votes_obtained?: number | null;
          was_elected?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_electoral_district_id_fkey";
            columns: ["electoral_district_id"];
            isOneToOne: false;
            referencedRelation: "electoraldistrict";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_electoral_process_id_fkey";
            columns: ["electoral_process_id"];
            isOneToOne: false;
            referencedRelation: "electoralprocess";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_political_party_id_fkey";
            columns: ["political_party_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
        ];
      };
      candidatemetrics: {
        Row: {
          candidate_id: string;
          declared_assets_value: number;
          declared_income_annual: number;
          has_alimentary_debts: boolean;
          has_penal_sentences: boolean;
          has_postgraduate: boolean;
          last_updated: string;
          max_academic_level_score: number;
          political_experience_years: number;
          times_elected: number;
          total_legal_records: number;
          total_parties_belonged: number;
          total_previous_candidacies: number;
          years_in_current_party: number;
        };
        Insert: {
          candidate_id: string;
          declared_assets_value: number;
          declared_income_annual: number;
          has_alimentary_debts: boolean;
          has_penal_sentences: boolean;
          has_postgraduate: boolean;
          last_updated: string;
          max_academic_level_score: number;
          political_experience_years: number;
          times_elected: number;
          total_legal_records: number;
          total_parties_belonged: number;
          total_previous_candidacies: number;
          years_in_current_party: number;
        };
        Update: {
          candidate_id?: string;
          declared_assets_value?: number;
          declared_income_annual?: number;
          has_alimentary_debts?: boolean;
          has_penal_sentences?: boolean;
          has_postgraduate?: boolean;
          last_updated?: string;
          max_academic_level_score?: number;
          political_experience_years?: number;
          times_elected?: number;
          total_legal_records?: number;
          total_parties_belonged?: number;
          total_previous_candidacies?: number;
          years_in_current_party?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidatemetrics_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: true;
            referencedRelation: "candidate";
            referencedColumns: ["id"];
          },
        ];
      };
      electoraldistrict: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          id: string;
          is_national: boolean;
          name: string;
          num_deputies: number;
          num_senators: number;
          updated_at: string;
        };
        Insert: {
          active: boolean;
          code: string;
          created_at: string;
          id: string;
          is_national: boolean;
          name: string;
          num_deputies: number;
          num_senators: number;
          updated_at: string;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          id?: string;
          is_national?: boolean;
          name?: string;
          num_deputies?: number;
          num_senators?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      electoralprocess: {
        Row: {
          active: boolean;
          created_at: string;
          election_date: string;
          id: string;
          name: string;
          updated_at: string;
          year: number;
        };
        Insert: {
          active: boolean;
          created_at: string;
          election_date: string;
          id: string;
          name: string;
          updated_at: string;
          year: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          election_date?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      executive: {
        Row: {
          created_at: string;
          end_date: string | null;
          end_reason: Database["public"]["Enums"]["endoftermreason"] | null;
          id: string;
          ministry: string | null;
          person_id: string;
          role: Database["public"]["Enums"]["executiverole"];
          start_date: string;
          updated_at: string;
        };
        Insert: {
          created_at: string;
          end_date?: string | null;
          end_reason?: Database["public"]["Enums"]["endoftermreason"] | null;
          id: string;
          ministry?: string | null;
          person_id: string;
          role: Database["public"]["Enums"]["executiverole"];
          start_date: string;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          end_reason?: Database["public"]["Enums"]["endoftermreason"] | null;
          id?: string;
          ministry?: string | null;
          person_id?: string;
          role?: Database["public"]["Enums"]["executiverole"];
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "executive_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      financingreports: {
        Row: {
          created_at: string;
          filing_status: Database["public"]["Enums"]["financingstatus"];
          id: string;
          party_id: string;
          period_end: string;
          period_start: string;
          report_date: string;
          report_name: string;
          source_name: string;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          filing_status: Database["public"]["Enums"]["financingstatus"];
          id: string;
          party_id: string;
          period_end: string;
          period_start: string;
          report_date: string;
          report_name: string;
          source_name: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          filing_status?: Database["public"]["Enums"]["financingstatus"];
          id?: string;
          party_id?: string;
          period_end?: string;
          period_start?: string;
          report_date?: string;
          report_name?: string;
          source_name?: string;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financingreports_party_id_fkey";
            columns: ["party_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
        ];
      };
      legislator: {
        Row: {
          active: boolean;
          chamber: Database["public"]["Enums"]["chambertype"];
          condition: Database["public"]["Enums"]["legislatorcondition"];
          created_at: string;
          elected_by_party_id: string;
          electoral_district_id: string;
          end_date: string | null;
          id: string;
          institutional_email: string | null;
          person_id: string;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          active: boolean;
          chamber: Database["public"]["Enums"]["chambertype"];
          condition?: Database["public"]["Enums"]["legislatorcondition"];
          created_at: string;
          elected_by_party_id: string;
          electoral_district_id: string;
          end_date?: string | null;
          id: string;
          institutional_email?: string | null;
          person_id: string;
          start_date: string;
          updated_at: string;
        };
        Update: {
          active?: boolean;
          chamber?: Database["public"]["Enums"]["chambertype"];
          condition?: Database["public"]["Enums"]["legislatorcondition"];
          created_at?: string;
          elected_by_party_id?: string;
          electoral_district_id?: string;
          end_date?: string | null;
          id?: string;
          institutional_email?: string | null;
          person_id?: string;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legislator_elected_by_party_id_fkey";
            columns: ["elected_by_party_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legislator_electoral_district_id_fkey";
            columns: ["electoral_district_id"];
            isOneToOne: false;
            referencedRelation: "electoraldistrict";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legislator_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
        ];
      };
      legislatormetrics: {
        Row: {
          administrative_records: number;
          approval_rate: number | null;
          attendance_rate: number | null;
          bills_aprobado: number;
          bills_en_comision: number;
          bills_en_proceso: number;
          bills_presentado: number;
          bills_rechazado: number;
          bills_retirado_por_autor: number;
          civil_records: number;
          days_in_current_group: number | null;
          ethical_records: number;
          is_defector: boolean;
          last_updated: string;
          legislator_id: string;
          penal_records: number;
          sessions_absent: number;
          sessions_justified: number;
          sessions_license: number;
          sessions_present: number;
          total_bills: number;
          total_legal_records: number;
          total_party_changes: number;
          total_sessions: number;
        };
        Insert: {
          administrative_records: number;
          approval_rate?: number | null;
          attendance_rate?: number | null;
          bills_aprobado: number;
          bills_en_comision: number;
          bills_en_proceso: number;
          bills_presentado: number;
          bills_rechazado: number;
          bills_retirado_por_autor: number;
          civil_records: number;
          days_in_current_group?: number | null;
          ethical_records: number;
          is_defector: boolean;
          last_updated: string;
          legislator_id: string;
          penal_records: number;
          sessions_absent: number;
          sessions_justified: number;
          sessions_license: number;
          sessions_present: number;
          total_bills: number;
          total_legal_records: number;
          total_party_changes: number;
          total_sessions: number;
        };
        Update: {
          administrative_records?: number;
          approval_rate?: number | null;
          attendance_rate?: number | null;
          bills_aprobado?: number;
          bills_en_comision?: number;
          bills_en_proceso?: number;
          bills_presentado?: number;
          bills_rechazado?: number;
          bills_retirado_por_autor?: number;
          civil_records?: number;
          days_in_current_group?: number | null;
          ethical_records?: number;
          is_defector?: boolean;
          last_updated?: string;
          legislator_id?: string;
          penal_records?: number;
          sessions_absent?: number;
          sessions_justified?: number;
          sessions_license?: number;
          sessions_present?: number;
          total_bills?: number;
          total_legal_records?: number;
          total_party_changes?: number;
          total_sessions?: number;
        };
        Relationships: [
          {
            foreignKeyName: "legislatormetrics_legislator_id_fkey";
            columns: ["legislator_id"];
            isOneToOne: true;
            referencedRelation: "legislator";
            referencedColumns: ["id"];
          },
        ];
      };
      parliamentarygroup: {
        Row: {
          acronym: string | null;
          active: boolean;
          color_hex: string | null;
          created_at: string;
          description: string | null;
          dissolution_date: string | null;
          formation_date: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          rules_url: string | null;
          updated_at: string;
        };
        Insert: {
          acronym?: string | null;
          active: boolean;
          color_hex?: string | null;
          created_at: string;
          description?: string | null;
          dissolution_date?: string | null;
          formation_date?: string | null;
          id: string;
          logo_url?: string | null;
          name: string;
          rules_url?: string | null;
          updated_at: string;
        };
        Update: {
          acronym?: string | null;
          active?: boolean;
          color_hex?: string | null;
          created_at?: string;
          description?: string | null;
          dissolution_date?: string | null;
          formation_date?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          rules_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      parliamentarymembership: {
        Row: {
          change_reason: Database["public"]["Enums"]["groupchangereason"];
          created_at: string;
          end_date: string | null;
          id: string;
          legislator_id: string;
          notes: string | null;
          parliamentary_group_id: string;
          source_url: string | null;
          start_date: string;
        };
        Insert: {
          change_reason: Database["public"]["Enums"]["groupchangereason"];
          created_at?: string;
          end_date?: string | null;
          id: string;
          legislator_id: string;
          notes?: string | null;
          parliamentary_group_id: string;
          source_url?: string | null;
          start_date: string;
        };
        Update: {
          change_reason?: Database["public"]["Enums"]["groupchangereason"];
          created_at?: string;
          end_date?: string | null;
          id?: string;
          legislator_id?: string;
          notes?: string | null;
          parliamentary_group_id?: string;
          source_url?: string | null;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parliamentarymembership_legislator_id_fkey";
            columns: ["legislator_id"];
            isOneToOne: false;
            referencedRelation: "legislator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parliamentarymembership_parliamentary_group_id_fkey";
            columns: ["parliamentary_group_id"];
            isOneToOne: false;
            referencedRelation: "parliamentarygroup";
            referencedColumns: ["id"];
          },
        ];
      };
      partyfinancing: {
        Row: {
          amount: number;
          category: Database["public"]["Enums"]["financingcategory"];
          created_at: string;
          currency: string;
          financing_report_id: string;
          flow_type: Database["public"]["Enums"]["flowtype"];
          id: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          category?: Database["public"]["Enums"]["financingcategory"];
          created_at?: string;
          currency?: string;
          financing_report_id: string;
          flow_type?: Database["public"]["Enums"]["flowtype"];
          id: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: Database["public"]["Enums"]["financingcategory"];
          created_at?: string;
          currency?: string;
          financing_report_id?: string;
          flow_type?: Database["public"]["Enums"]["flowtype"];
          id?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partyfinancing_financing_report_id_fkey";
            columns: ["financing_report_id"];
            isOneToOne: false;
            referencedRelation: "financingreports";
            referencedColumns: ["id"];
          },
        ];
      };
      person: {
        Row: {
          academic_degree: string | null;
          birth_date: string | null;
          created_at: string;
          detailed_biography: Json | null;
          facebook_url: string | null;
          fullname: string;
          id: string;
          image_url: string | null;
          instagram_url: string | null;
          lastname: string;
          name: string;
          postgraduate_education: string | null;
          profession: string | null;
          professional_title: string | null;
          resume_url: string | null;
          technical_education: string | null;
          tiktok_url: string | null;
          twitter_url: string | null;
          university_education: string | null;
          updated_at: string;
          work_experience: Json | null;
        };
        Insert: {
          academic_degree?: string | null;
          birth_date?: string | null;
          created_at: string;
          detailed_biography?: Json | null;
          facebook_url?: string | null;
          fullname: string;
          id: string;
          image_url?: string | null;
          instagram_url?: string | null;
          lastname: string;
          name: string;
          postgraduate_education?: string | null;
          profession?: string | null;
          professional_title?: string | null;
          resume_url?: string | null;
          technical_education?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          university_education?: string | null;
          updated_at: string;
          work_experience?: Json | null;
        };
        Update: {
          academic_degree?: string | null;
          birth_date?: string | null;
          created_at?: string;
          detailed_biography?: Json | null;
          facebook_url?: string | null;
          fullname?: string;
          id?: string;
          image_url?: string | null;
          instagram_url?: string | null;
          lastname?: string;
          name?: string;
          postgraduate_education?: string | null;
          profession?: string | null;
          professional_title?: string | null;
          resume_url?: string | null;
          technical_education?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          university_education?: string | null;
          updated_at?: string;
          work_experience?: Json | null;
        };
        Relationships: [];
      };
      politicalparty: {
        Row: {
          acronym: string | null;
          active: boolean;
          color_hex: string | null;
          core_values: string | null;
          created_at: string;
          email: string | null;
          facebook_url: string | null;
          foundation_date: string | null;
          founder: string | null;
          government_audio_url: string | null;
          government_plan_summary: Json | null;
          government_plan_url: string | null;
          id: string;
          ideology: string | null;
          legal_cases: Json | null;
          logo_url: string | null;
          main_office: string | null;
          name: string;
          party_president: string | null;
          party_timeline: Json | null;
          phone: string | null;
          purpose: string | null;
          slogan: string | null;
          tiktok_url: string | null;
          total_afiliates: number | null;
          twitter_url: string | null;
          type: Database["public"]["Enums"]["organizationtype"] | null;
          updated_at: string;
          website: string | null;
          youtube_url: string | null;
        };
        Insert: {
          acronym?: string | null;
          active: boolean;
          color_hex?: string | null;
          core_values?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          foundation_date?: string | null;
          founder?: string | null;
          government_audio_url?: string | null;
          government_plan_summary?: Json | null;
          government_plan_url?: string | null;
          id: string;
          ideology?: string | null;
          legal_cases?: Json | null;
          logo_url?: string | null;
          main_office?: string | null;
          name: string;
          party_president?: string | null;
          party_timeline?: Json | null;
          phone?: string | null;
          purpose?: string | null;
          slogan?: string | null;
          tiktok_url?: string | null;
          total_afiliates?: number | null;
          twitter_url?: string | null;
          type?: Database["public"]["Enums"]["organizationtype"] | null;
          updated_at?: string;
          website?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          acronym?: string | null;
          active?: boolean;
          color_hex?: string | null;
          core_values?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          foundation_date?: string | null;
          founder?: string | null;
          government_audio_url?: string | null;
          government_plan_summary?: Json | null;
          government_plan_url?: string | null;
          id?: string;
          ideology?: string | null;
          legal_cases?: Json | null;
          logo_url?: string | null;
          main_office?: string | null;
          name?: string;
          party_president?: string | null;
          party_timeline?: Json | null;
          phone?: string | null;
          purpose?: string | null;
          slogan?: string | null;
          tiktok_url?: string | null;
          total_afiliates?: number | null;
          twitter_url?: string | null;
          type?: Database["public"]["Enums"]["organizationtype"] | null;
          updated_at?: string;
          website?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          company: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_sign_in_at: string | null;
          phone: string | null;
          role: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      seatparliamentary: {
        Row: {
          chamber: Database["public"]["Enums"]["chambertype"];
          created_at: string;
          id: string;
          legislator_id: string | null;
          number_seat: number;
          row: number;
          updated_at: string;
        };
        Insert: {
          chamber: Database["public"]["Enums"]["chambertype"];
          created_at: string;
          id: string;
          legislator_id?: string | null;
          number_seat: number;
          row: number;
          updated_at: string;
        };
        Update: {
          chamber?: Database["public"]["Enums"]["chambertype"];
          created_at?: string;
          id?: string;
          legislator_id?: string | null;
          number_seat?: number;
          row?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seatparliamentary_legislator_id_fkey";
            columns: ["legislator_id"];
            isOneToOne: false;
            referencedRelation: "legislator";
            referencedColumns: ["id"];
          },
        ];
      };
      team: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          linkedin_url: string | null;
          portfolio_url: string | null;
          is_principal: boolean;
          email: string;
          role: string;
          image_url: string | null;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          is_principal?: boolean;
          email: string;
          role: string;
          image_url: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          is_principal?: boolean;
          email?: string;
          role?: string;
          image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      party_seats_by_district: {
        Row: {
          district_code: string | null;
          district_name: string | null;
          elected_by_party_id: string | null;
          seats: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "legislator_elected_by_party_id_fkey";
            columns: ["elected_by_party_id"];
            isOneToOne: false;
            referencedRelation: "politicalparty";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      current_parliamentary_group: {
        Args: {
          legislator_row: Database["public"]["Tables"]["legislator"]["Row"];
        };
        Returns: Json;
      };
      get_partido_detail: { Args: { p_partido_id: string }; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
      legislator_fullname: {
        Args: {
          legislator_row: Database["public"]["Tables"]["legislator"]["Row"];
        };
        Returns: string;
      };
    };
    Enums: {
      attendancestatus:
        | "ASISTENCIA"
        | "FALTA"
        | "FALTA_JUSTIFICADA"
        | "TARDANZA"
        | "LICENCIA"
        | "COMISION_OFICIAL";
      backgroundstatus:
        | "EN_INVESTIGACION"
        | "SENTENCIADO"
        | "SANCIONADO"
        | "ARCHIVADO"
        | "ABSUELTO"
        | "NO_ESPECIFICADO";
      backgroundtype: "PENAL" | "ETICA" | "CIVIL" | "ADMINISTRATIVO";
      billapprovalstatus:
        | "PRESENTADO"
        | "EN_COMISION"
        | "DICTAMEN"
        | "EN_AGENDA_PLENO"
        | "ORDEN_DEL_DIA"
        | "EN_CUARTO_INTERMEDIO"
        | "APROBADO_PRIMERA_VOTACION"
        | "PENDIENTE_SEGUNDA_VOTACION"
        | "APROBADO"
        | "AUTOGRAFA"
        | "PUBLICADO"
        | "EN_RECONSIDERACION"
        | "RETORNA_A_COMISION"
        | "AL_ARCHIVO"
        | "DECRETO_ARCHIVO"
        | "RETIRADO_POR_AUTOR";
      candidacystatus: "INSCRITO" | "HABILITADO" | "INHABILITADO" | "TACADO";
      candidacytype:
        | "PRESIDENTE"
        | "VICEPRESIDENTE"
        | "SENADOR"
        | "DIPUTADO"
        | "CONGRESISTA";
      chambertype: "CONGRESO" | "SENADO" | "DIPUTADOS";
      endoftermreason:
        | "RENUNCIA"
        | "REMOCION"
        | "FALLECIMIENTO"
        | "VACANCIA"
        | "PERIODO_FINALIZADO"
        | "DESCONOCIDO";
      executiverole:
        | "PRESIDENTE"
        | "VICEPRESIDENTE"
        | "PRIMER_MINISTRO"
        | "MINISTRO";
      financingcategory: "INGRESO" | "GASTO" | "DEUDA";
      financingstatus:
        | "DENTRO_DEL_PLAZO"
        | "FUERA_DEL_PLAZO"
        | "NO_PRESENTARON";
      flowtype:
        | "I_FPD"
        | "I_F_PRIVADO"
        | "I_OPERACIONALES"
        | "G_FONDO_FPD"
        | "G_FONDO_F_PRIVADO"
        | "G_OPERACIONALES"
        | "D_TOTAL";
      groupchangereason:
        | "INICIAL"
        | "CAMBIO_VOLUNTARIO"
        | "EXPULSION"
        | "RENUNCIA"
        | "DISOLUCION_BANCADA"
        | "CAMBIO_ESTRATEGICO"
        | "SANCION_DISCIPLINARIA"
        | "OTRO";
      legislatorcondition:
        | "EN_EJERCICIO"
        | "FALLECIDO"
        | "SUSPENDIDO"
        | "LICENCIA"
        | "DESTITUIDO";
      organizationtype: "PARTIDO" | "ALIANZA";
      sessiontype:
        | "PLENO"
        | "COMISION_PERMANENTE"
        | "COMISION_ORDINARIA"
        | "EXTRAORDINARIA";
      userrole: "SUPERADMIN" | "ADMIN" | "EDITOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attendancestatus: [
        "ASISTENCIA",
        "FALTA",
        "FALTA_JUSTIFICADA",
        "TARDANZA",
        "LICENCIA",
        "COMISION_OFICIAL",
      ],
      backgroundstatus: [
        "EN_INVESTIGACION",
        "SENTENCIADO",
        "SANCIONADO",
        "ARCHIVADO",
        "ABSUELTO",
        "NO_ESPECIFICADO",
      ],
      backgroundtype: ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"],
      billapprovalstatus: [
        "PRESENTADO",
        "EN_COMISION",
        "DICTAMEN",
        "EN_AGENDA_PLENO",
        "ORDEN_DEL_DIA",
        "EN_CUARTO_INTERMEDIO",
        "APROBADO_PRIMERA_VOTACION",
        "PENDIENTE_SEGUNDA_VOTACION",
        "APROBADO",
        "AUTOGRAFA",
        "PUBLICADO",
        "EN_RECONSIDERACION",
        "RETORNA_A_COMISION",
        "AL_ARCHIVO",
        "DECRETO_ARCHIVO",
        "RETIRADO_POR_AUTOR",
      ],
      candidacystatus: ["INSCRITO", "HABILITADO", "INHABILITADO", "TACADO"],
      candidacytype: [
        "PRESIDENTE",
        "VICEPRESIDENTE",
        "SENADOR",
        "DIPUTADO",
        "CONGRESISTA",
      ],
      chambertype: ["CONGRESO", "SENADO", "DIPUTADOS"],
      endoftermreason: [
        "RENUNCIA",
        "REMOCION",
        "FALLECIMIENTO",
        "VACANCIA",
        "PERIODO_FINALIZADO",
        "DESCONOCIDO",
      ],
      executiverole: [
        "PRESIDENTE",
        "VICEPRESIDENTE",
        "PRIMER_MINISTRO",
        "MINISTRO",
      ],
      financingcategory: ["INGRESO", "GASTO", "DEUDA"],
      financingstatus: [
        "DENTRO_DEL_PLAZO",
        "FUERA_DEL_PLAZO",
        "NO_PRESENTARON",
      ],
      flowtype: [
        "I_FPD",
        "I_F_PRIVADO",
        "I_OPERACIONALES",
        "G_FONDO_FPD",
        "G_FONDO_F_PRIVADO",
        "G_OPERACIONALES",
        "D_TOTAL",
      ],
      groupchangereason: [
        "INICIAL",
        "CAMBIO_VOLUNTARIO",
        "EXPULSION",
        "RENUNCIA",
        "DISOLUCION_BANCADA",
        "CAMBIO_ESTRATEGICO",
        "SANCION_DISCIPLINARIA",
        "OTRO",
      ],
      legislatorcondition: [
        "EN_EJERCICIO",
        "FALLECIDO",
        "SUSPENDIDO",
        "LICENCIA",
        "DESTITUIDO",
      ],
      organizationtype: ["PARTIDO", "ALIANZA"],
      sessiontype: [
        "PLENO",
        "COMISION_PERMANENTE",
        "COMISION_ORDINARIA",
        "EXTRAORDINARIA",
      ],
      userrole: ["SUPERADMIN", "ADMIN", "EDITOR"],
    },
  },
} as const;
