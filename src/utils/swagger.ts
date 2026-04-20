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
        HrRegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: {
              type: "string",
              example: "Dang Duy Bao",
            },
            email: {
              type: "string",
              format: "email",
              example: "manager@seeds.vn",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "secret123",
              description: "Plain password for recruiter login",
            },
            phone: {
              type: "string",
              example: "0988888888",
              nullable: true,
            },
            gender: {
              type: "string",
              enum: ["Nam", "Nữ", "Khác"],
              example: "Nam",
            },
            avatarUrl: {
              type: "string",
              format: "uri",
              example: "https://example.com/avatar.jpg",
            },
            linkedinUrl: {
              type: "string",
              format: "uri",
              example: "https://linkedin.com/in/manager-seeds",
            },
            githubUrl: {
              type: "string",
              format: "uri",
              example: "https://github.com/manager-seeds",
            },
            facebookUrl: {
              type: "string",
              format: "uri",
              example: "https://facebook.com/manager.seeds",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["identifier", "password"],
          properties: {
            identifier: {
              type: "string",
              example: "23520408",
              description:
                "Recruiter email for normal_auth or UIT student ID for uit_auth",
            },
            password: {
              type: "string",
              example: "secret123",
              description:
                "Encrypted UIT password when identifier is a student ID, plain password when identifier is an email",
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          properties: {
            refresh_token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              description: "Refresh token using the snake_case field name",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              description: "Refresh token using the camelCase field name",
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
            academicInfo: {
              type: "object",
              properties: {
                university: {
                  type: "string",
                  example: "University of Information Technology",
                },
                major: { type: "string", example: "Computer Science" },
                graduationYear: { type: "number", example: 2027 },
                gpa: { type: "number", example: 3.4 },
              },
            },
            advantagePoint: {
              type: "string",
              example: "Fast learner and strong ownership mindset",
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
            technicalSkills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: [
                      "Ngôn ngữ lập trình",
                      "Framework",
                      "OS",
                      "Database",
                      "Cloud",
                      "Version Control",
                      "Công cụ quản lý dự án",
                      "Khác",
                    ],
                    example: "Framework",
                  },
                  name: { type: "string", example: "React" },
                  yearsOfExperience: { type: "number", example: 2 },
                  confidence: { type: "boolean", example: true },
                },
              },
            },
            softSkills: {
              type: "array",
              items: { type: "string" },
              example: ["Communication", "Teamwork", "Problem solving"],
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", example: "E-learning Platform" },
                  description: {
                    type: "string",
                    example: "Build LMS backend with Node.js and MongoDB",
                  },
                  technologies: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Node.js", "TypeScript", "MongoDB"],
                  },
                  role: { type: "string", example: "Backend Developer" },
                  contribution: {
                    type: "string",
                    example: "Designed API and database schema",
                  },
                  startDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-01-01T00:00:00.000Z",
                  },
                  endDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-06-01T00:00:00.000Z",
                  },
                  teamSize: { type: "number", example: 4 },
                  repositoryUrl: {
                    type: "string",
                    example: "https://github.com/example/lms",
                  },
                  reportUrl: {
                    type: "string",
                    example: "https://docs.google.com/document/d/example",
                  },
                },
              },
            },
            workExperiences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  companyName: { type: "string", example: "SEeds Tech" },
                  position: {
                    type: "string",
                    example: "Intern Backend Developer",
                  },
                  startDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-07-01T00:00:00.000Z",
                  },
                  endDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-09-01T00:00:00.000Z",
                  },
                  description: {
                    type: "string",
                    example: "Implemented REST APIs and unit tests",
                  },
                  technologiesUsed: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Express", "MongoDB", "Jest"],
                  },
                },
              },
            },
            introductionQuestions: {
              type: "object",
              properties: {
                preferredRoles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      preferredRole: {
                        type: "string",
                        enum: [
                          "Frontend",
                          "Backend",
                          "Fullstack",
                          "Mobile",
                          "DevOps",
                          "QA",
                          "Khác",
                        ],
                        example: "Backend",
                      },
                    },
                  },
                },
                whyTheseRoles: {
                  type: "string",
                  example: "I enjoy solving system design and API problems.",
                },
                futureGoals: {
                  type: "string",
                  example: "Become a senior backend engineer in 3 years.",
                },
                favoriteTechnology: { type: "string", example: "TypeScript" },
              },
            },
          },
          example: {
            academicInfo: {
              university: "University of Information Technology",
              major: "Computer Science",
              graduationYear: 2027,
              gpa: 3.4,
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
            advantagePoint: "Fast learner and strong ownership mindset",
            technicalSkills: [
              {
                category: "Framework",
                name: "React",
                yearsOfExperience: 2,
                confidence: true,
              },
              {
                category: "Ngôn ngữ lập trình",
                name: ".NET",
                yearsOfExperience: 2,
                confidence: true,
              },
            ],
            softSkills: ["Communication", "Teamwork", "Problem solving"],
            projects: [
              {
                name: "E-learning Platform",
                description: "Build LMS backend with Node.js and MongoDB",
                technologies: ["Node.js", "TypeScript", "MongoDB"],
                role: "Backend Developer",
                contribution: "Designed API and database schema",
                startDate: "2025-01-01T00:00:00.000Z",
                endDate: "2025-06-01T00:00:00.000Z",
                teamSize: 4,
                repositoryUrl: "https://github.com/example/lms",
                reportUrl: "https://docs.google.com/document/d/example",
              },
            ],
            workExperiences: [
              {
                companyName: "SEeds Tech",
                position: "Intern Backend Developer",
                startDate: "2025-07-01T00:00:00.000Z",
                endDate: "2025-09-01T00:00:00.000Z",
                description: "Implemented REST APIs and unit tests",
                technologiesUsed: ["Express", "MongoDB", "Jest"],
              },
            ],
            introductionQuestions: {
              preferredRoles: [
                { preferredRole: "Backend" },
                { preferredRole: "Fullstack" },
              ],
              whyTheseRoles: "I enjoy solving system design and API problems.",
              futureGoals: "Become a senior backend engineer in 3 years.",
              favoriteTechnology: "TypeScript",
            },
          },
        },
        CandidateProfilePatchResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Cập nhật CandidateProfile thành công.",
            },
            data: {
              type: "object",
              properties: {
                _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                userId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d0" },
                technicalSkills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", example: "Framework" },
                      skillId: {
                        type: "string",
                        description: "ObjectId của Skill",
                        example: "65f1a2b3c4d5e6f7a8b9c0d2",
                      },
                      name: { type: "string", example: "React" },
                      yearsOfExperience: { type: "number", example: 2 },
                      confidence: { type: "boolean", example: true },
                    },
                  },
                },
                softSkills: {
                  type: "array",
                  items: { type: "string" },
                  example: ["Communication", "Teamwork"],
                },
              },
            },
            meta: {
              type: "object",
              properties: {
                matchedCount: { type: "number", example: 1 },
                modifiedCount: { type: "number", example: 1 },
              },
            },
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
