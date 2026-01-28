// Type for individual configuration fields
type FieldType = 'text' | 'number' | 'select' | 'url' | 'image' | 'boolean' | 'json';

export interface IConfigField {
    key: string;
    value: string;
    description: string;
    type: FieldType;
}

// Main interface for the review configuration
export interface IReviewConfiguration {
    merchantId: string;
    emailContent: IConfigField[];
    reminderEmailContent: IConfigField[];
    remindersFrequency: IConfigField[];
    publish: IConfigField[];
    qrCode: IConfigField[];
    general: IGeneralConfigs;
}

// Optional: More specific interfaces if you want stricter typing
interface IEmailContentField extends IConfigField {
    key: 'subject' | 'body' | 'buttonText';
    type: 'text';
}

interface IReminderEmailContentField extends IConfigField {
    key: 'reminderSubject' | 'reminderBody' | 'reminderButtonText';
    type: 'text';
}

interface IRemindersFrequencyField extends IConfigField {
    key: 'remindersQty' | 'remindersPeriod';
    type: 'number' | 'select';
}

export interface IPublishField extends IConfigField {
    key: 'autoPublish';
    type: 'select';
    value: 'THREESTARS' | 'FOURSTARS' | 'FIVESTARS';
}

interface IQrCodeField extends IConfigField {
    key: 'qrCodeUrl' | 'qrCodeData';
    type: 'url' | 'image';
}

interface IGeneralConfigs {
    shopReviewQuestions: IConfigField[];
}

// Stricter version of the main interface (optional)
export interface IStrictReviewConfiguration {
    merchantId: string;
    emailContent: IEmailContentField[];
    reminderEmailContent: IReminderEmailContentField[];
    remindersFrequency: IRemindersFrequencyField[];
    publish: IPublishField[];
    qrCode: IQrCodeField[];
    general: IGeneralConfigs;
}
