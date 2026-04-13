import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface INormalAuth {
    email: string;
    passwordHash: string;
    passwordUpdatedAt: Date;
}

export interface IContactInfo {
    email: string;
    phone?: string | null;
    githubUrl?: string;
    linkedinUrl?: string;
    facebookUrl?: string;
}
export interface IUser extends Document {
    role: 'candidate' | 'recruiter' | 'admin';
    authMethod: 'uit_auth' | 'normal_auth';
    status: 'active' | 'inactive' | 'blocked';

    fullName: string;
    dateOfBirth?: Date;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    avatarUrl?: string;


    studentID?: string; // For candidates

    normalAuth?: INormalAuth; // For others

    contactInfo: IContactInfo;
    createdAt: Date;
    updatedAt: Date;
}


// ─── Schema ───────────────────────────────────────────────────────────────────

const ContactInfoSchema = new Schema<IContactInfo>(
    {
        email: { type: String, required: true },
        phone: { type: String, default: null },
        githubUrl: String,
        linkedinUrl: String,  
        facebookUrl: String,
    },
    { _id: false }
);

const NormalAuthSchema = new Schema<INormalAuth>(
    {
        email: { type: String, required: true },    
        passwordHash: { type: String, required: true },
        passwordUpdatedAt: { type: Date, required: true },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        role: { type: String, enum: ['candidate', 'recruiter', 'admin'], required: true },
        authMethod: { type: String, enum: ['uit_auth', 'normal_auth'], required: true},
        status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
        fullName: { type: String, required: true },
        dateOfBirth: Date,
        gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'] },
        
        avatarUrl: String,
        studentID: { type: String, unique: true, sparse: true },
        normalAuth: NormalAuthSchema,
        contactInfo: { type: ContactInfoSchema, required: true },
    },
    { timestamps: true }
)

UserSchema.index({ 'normalAuth.email': 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 , status: 1 });


// ─── Model ────────────────────────────────────────────────────────────────────


export const User = model<IUser>('User', UserSchema);
