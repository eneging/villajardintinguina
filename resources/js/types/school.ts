export type Role = 'admin' | 'teacher' | 'intern' | 'parent' | 'student';

export type MediaItem = {
    id: number;
    resource_type: 'image' | 'video' | 'raw';
    url: string;
    thumbnail: string | null;
    format: string | null;
    original_filename: string | null;
};

export type StaffMember = {
    id: number;
    name: string;
    role: 'titular' | 'auxiliar' | 'practicante';
};

export type ClassroomSummary = {
    id: number;
    name: string;
    level: string;
    shift?: string;
    color: string;
    mascot: string | null;
    staff?: StaffMember[];
    students_count?: number | null;
    modules_count?: number | null;
    published_modules_count?: number | null;
};

export type BlockType =
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'activity'
    | 'confirmation';

export type BlockContent = {
    body?: string;
    title?: string;
    caption?: string;
    youtube_url?: string;
};

export type ContentBlock = {
    id?: number;
    type: BlockType;
    content: BlockContent;
    media: MediaItem | null;
};

export type ModuleStatus = 'draft' | 'published';

export type LearningModuleCard = {
    id: number;
    title: string;
    area: string;
    area_label: string;
    summary: string | null;
    starts_on: string;
    ends_on: string;
    status: ModuleStatus;
    cover: MediaItem | null;
    classroom?: string;
};

export type LearningModuleDetail = LearningModuleCard & {
    goals: string[];
    cover_media_id: number | null;
    author: string | null;
    published_at: string | null;
    blocks: ContentBlock[];
};

export type Option = { value: string; label: string };

export type InductionTargets = {
    general: boolean;
    level_ids: number[];
    classroom_ids: number[];
};

export type InductionLessonCard = {
    id: number;
    title: string;
    description: string | null;
    audience: 'parents' | 'staff';
    is_required: boolean;
    status: ModuleStatus;
    cover: MediaItem | null;
    targets: InductionTargets;
    completed?: boolean;
    completed_count?: number;
};

export type InductionLessonDetail = InductionLessonCard & {
    position: number;
    cover_media_id: number | null;
    blocks: ContentBlock[];
};

export type Provider = {
    name: string;
    legal_name: string;
    ruc: string;
    address: string;
};

export type Complaint = {
    id: number;
    code: string;
    type: 'reclamo' | 'queja';
    type_label: string;
    created_at: string;
    consumer_name: string;
    consumer_document_type: string;
    consumer_document_number: string;
    consumer_address: string;
    consumer_phone: string;
    consumer_email: string;
    is_minor: boolean;
    guardian_name: string | null;
    guardian_document_number: string | null;
    item_type: 'producto' | 'servicio';
    item_description: string;
    amount: string | null;
    detail: string;
    request: string;
    response_due_on: string;
    response: string | null;
    responded_at: string | null;
};
