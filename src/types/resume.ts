export interface ResumeSection {
  title: string;
  content: string;
  original_content?: string;
}

export interface ResumeSkill {
  name: string;
  relevance: number;
  matched: boolean;
}

export interface ResumeCustomizationResult {
  customized_sections?: ResumeSection[];
  skills_analysis?: {
    matched_skills?: string[];
    missing_skills?: string[];
    all_skills?: ResumeSkill[];
  };
  talking_points?: string[];
  pdf_path?: string;
  s3_url?: string;
  latex_source?: string;
}

export interface ResumeApiError {
  error: string;
  status?: number;
} 