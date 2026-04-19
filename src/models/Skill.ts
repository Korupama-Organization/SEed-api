import {Schema, model, Types, Document} from 'mongoose';

export interface ISkill extends Document {
    skill_name: string;
    category: string;
}

const SkillSchema = new Schema<ISkill>({
    skill_name: { type: String, required: true, unique: true },
    category: { 
        type: String, 
        required: true, 
        enum: ['Framework', 'Ngôn ngữ lập trình', 'OS', 'Database', 'Cloud', 'Version Control', 'Công cụ quản lý dự án', 'Khác']
    }
});

export const Skill = model<ISkill>('Skill', SkillSchema);
