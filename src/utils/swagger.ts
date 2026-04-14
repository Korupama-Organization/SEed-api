import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Studuy API",
      version: "1.0.0",
      description: "REST API documentation for Studuy LMS platform",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "phone", "password"],
          properties: {
            fullName: { type: "string", example: "Nguyen Van A" },
            email: {
              type: "string",
              format: "email",
              example: "nguyenvana@example.com",
            },
            phone: { type: "string", example: "0912345678" },
            password: { type: "string", minLength: 6, example: "secret123" },
            role: {
              type: "string",
              enum: ["student", "teacher", "admin"],
              default: "student",
            },
            avatar: {
              type: "string",
              format: "uri",
              example: "https://i.pravatar.cc/150",
            },
            authProvider: {
              type: "string",
              default: "local",
              example: "local",
            },
            teacherProfile: {
              type: "object",
              description: 'Only applicable when role is "teacher"',
              properties: {
                bio: {
                  type: "string",
                  example: "Giáo viên Toán 10 năm kinh nghiệm",
                },
                expertise: {
                  type: "array",
                  items: { type: "string" },
                  example: ["Math", "Physics"],
                },
                bankAccount: {
                  type: "object",
                  properties: {
                    bankName: { type: "string", example: "Vietcombank" },
                    number: { type: "string", example: "1234567890" },
                  },
                },
              },
            },
          },
        },
        VerifyOtpRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "nguyenvana@example.com",
            },
            otp: { type: "string", example: "123456" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["password"],
          properties: {
            userID: {
              type: "string",
              example: "23520408",
              description: "UIT student ID for candidate login",
            },
            email: {
              type: "string",
              format: "email",
              example: "hr@company.com",
              description: "Email for normal_auth login",
            },
            password: {
              type: "string",
              example: "secret123",
              description:
                "Encrypted UIT password for uit_auth, plain password for normal_auth",
            },
            authMethod: {
              type: "string",
              enum: ["uit_auth", "normal_auth"],
              example: "uit_auth",
            },
            type: {
              type: "string",
              enum: ["candidate", "hr", "recruiter", "admin"],
              example: "candidate",
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refresh_token"],
          properties: {
            refresh_token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "nguyenvana@example.com",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["reset_token", "new_password"],
          properties: {
            reset_token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            new_password: {
              type: "string",
              minLength: 6,
              example: "newSecret123",
            },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
            fullName: { type: "string", example: "Nguyen Van A" },
            email: { type: "string", example: "nguyenvana@example.com" },
            phone: { type: "string", example: "0912345678" },
            role: { type: "string", example: "student" },
            avatar: { type: "string", example: "https://i.pravatar.cc/150" },
            authProvider: { type: "string", example: "local" },
            isBlocked: { type: "boolean", example: false },
            emailVerified: { type: "boolean", example: false },
            passwordUpdatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CandidateProfilePatchRequest: {
          type: "object",
          description:
            "Partial update for candidate profile. Send only fields you want to update.",
          properties: {
            basicInfo: {
              type: "object",
              properties: {
                mssv: { type: "string", example: "2152xxxx" },
                fullName: { type: "string", example: "Nguyen Van A" },
                birthday: {
                  type: "string",
                  format: "date-time",
                  example: "2003-01-01T00:00:00.000Z",
                },
                gender: {
                  type: "string",
                  enum: ["Nam", "Nữ", "Khác"],
                  example: "Nam",
                },
                phone: { type: "string", example: "090xxxxxxx" },
                email: { type: "string", example: "student@gm.uit.edu.vn" },
                github: {
                  type: "string",
                  example: "https://github.com/nguyenvana",
                },
                facebook: {
                  type: "string",
                  example: "https://facebook.com/nguyenvana",
                },
                linkedin: {
                  type: "string",
                  example: "https://linkedin.com/in/nguyenvana",
                },
              },
            },
            education: {
              type: "object",
              properties: {
                school: {
                  type: "string",
                  example: "Đại học Công nghệ Thông tin - ĐHQG TP.HCM",
                },
                major: { type: "string", example: "Kỹ thuật Phần mềm" },
                expectedGraduation: { type: "string", example: "06/2025" },
                gpa: { type: "number", example: 3.6 },
              },
            },
            strengths: {
              type: "string",
              example:
                "Tư duy logic tốt, có khả năng tự học công nghệ mới nhanh chóng.",
            },
            skills: {
              type: "object",
              properties: {
                technical: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: {
                        type: "string",
                        example: "Programming Languages",
                      },
                      name: { type: "string", example: "TypeScript" },
                      yoe: { type: "number", example: 1 },
                      confidence: { type: "number", example: 1 },
                    },
                  },
                },
                softSkills: {
                  type: "array",
                  items: { type: "string" },
                  example: [
                    "Thuyết trình",
                    "Làm việc nhóm",
                    "Giải quyết vấn đề",
                  ],
                },
              },
            },
            languages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  certificateName: { type: "string", example: "IELTS" },
                  score: { type: "number", example: 7.0 },
                  issuedAt: {
                    type: "string",
                    format: "date-time",
                    example: "2024-01-01T00:00:00.000Z",
                  },
                  expiresAt: {
                    type: "string",
                    format: "date-time",
                    example: "2026-01-01T00:00:00.000Z",
                  },
                },
              },
            },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Top 10 Hackathon 2025" },
                  achievedAt: {
                    type: "string",
                    format: "date-time",
                    example: "2025-10-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
          example: {
            basicInfo: {
              mssv: "2152xxxx",
              fullName: "Nguyen Huu Lam Giang",
              birthday: "2003-01-01T00:00:00.000Z",
              gender: "Nam",
              phone: "090xxxxxxx",
              email: "student@gm.uit.edu.vn",
              github: "https://github.com/nguyenvana",
              facebook: "https://facebook.com/nguyenvana",
              linkedin: "https://linkedin.com/in/nguyenvana",
            },
            education: {
              school: "Đại học Công nghệ Thông tin - ĐHQG TP.HCM",
              major: "Kỹ thuật Phần mềm",
              expectedGraduation: "06/2025",
              gpa: 3.6,
            },
            strengths:
              "Tư duy logic tốt, có khả năng tự học công nghệ mới nhanh chóng.",
            skills: {
              technical: [
                {
                  category: "Programming Languages",
                  name: "TypeScript",
                  yoe: 1,
                  confidence: 1,
                },
                {
                  category: "Frameworks",
                  name: "NestJS",
                  yoe: 0.5,
                  confidence: 1,
                },
                {
                  category: "Databases",
                  name: "MongoDB",
                  yoe: 0.5,
                  confidence: 1,
                },
              ],
              softSkills: [
                "Thuyết trình",
                "Làm việc nhóm",
                "Giải quyết vấn đề",
              ],
            },
            languages: [
              {
                certificateName: "IELTS",
                score: 7,
                issuedAt: "2024-01-01T00:00:00.000Z",
                expiresAt: "2026-01-01T00:00:00.000Z",
              },
            ],
            achievements: [
              {
                title: "Top 10 Hackathon 2025",
                achievedAt: "2025-10-01T00:00:00.000Z",
              },
            ],
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Error message" },
          },
        },
      },
    },
  },
  // Auto-scan JSDoc comments from routes and controllers
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
