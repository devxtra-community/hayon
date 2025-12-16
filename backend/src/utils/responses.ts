
export class SuccessResponse {
    status: number;
    message: string;
    data?: any;
    constructor(status: number, message: string, data?: any) {
        this.status = status;
        this.message = message; 
        if (data) {
            this.data = data;
        }
    }
}


export class ErrorResponse {
    status: number;
    message: string;
    constructor(status: number, message: string) {
        this.status = status;
        this.message = message; 
    }

    
}
