export interface UploadResponse {
    success: boolean;
    key: string;
    etag: string;
    location: string;
}

export interface ImageUploadResult {
    success: boolean;
    imageKey: string;
    fileName: string;
    fileType: string;
    url: string;
    uploadedAt: Date;
    size: number;
}
