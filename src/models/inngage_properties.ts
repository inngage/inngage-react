export class InngageProperties {
    static identifier: string = '';
    static appToken: string = '';
    static phoneNumber: string = '';
    static email: string = '';
    static customFields: any = {};
    static blockDeepLink: boolean = false;
    static debugMode: boolean = false;
    static firebaseToken: string = '';
    static getDebugMode(): boolean {
        return InngageProperties.debugMode;
    }
}