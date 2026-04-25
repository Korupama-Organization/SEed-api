export interface CreateJobDto {
  basicInfo: {
    title: string;
    summary: string;
    jobDescription: string;
    roleType: string;
    headcount: number;
    locations: string[];
    workModel: string;
    level: string;
    jobType: string;
  };
  requirements: {
    requiredSkills: string[];
    preferredSkills: string[];
    requiredEducation: string;
    minGpa: number;
    requiredLanguages: string[];
    minMonthsExperience: number;
    portfolioExpected: string;
  };
}

/*
POST localhost:3000/api/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "basicInfo": {
    "title": "Fresher .NET Software Engineer",
    "summary": "Participate in all software development activities following Scrum process. Contribute to the design and implementation of software features or subsystems using .NET technologies. Write high-quality code to implement software features or fix bugs. Perform unit testing, documentation and all other activities defined in Definition of Done before passing source code to Testing team. Communicate and report internally or directly to client on status or result of work ",
    "jobDescription": "Passion for web application development using .NET technologies (e.g., ASP.NET Core, C#). Having knowledge of DevOps is a bonus.  Possess strong foundation of OOP, data structures, and algorithms.  Familiarity with web technologies such as HTML, CSS, JavaScript, and RESTful APIs.  Good knowledge of SQL and relational databases (e.g., SQL Server). NoSQL is a bonus.  Experience or familiarity with Entity Framework, LINQ, or similar ORM tools is an advantage.  Basic knowledge of unit testing and debugging techniques.  Familiarity with source control tools such as Git.  Understanding of software development best practices, including code maintainability and scalability.  Hands-on experience through university projects or internship assignments related to web development.",
    "roleType": "Backend",
    "headcount": 5,
    "locations": [
      "2 Tản Viên, Phường 2, Tân Sơn Hòa, Hồ Chí Minh, Việt Nam"
    ],
    "workModel": "On-site",
    "level": "Fresher",
    "jobType": "Full-time"
  },
  "requirements": {
    "requiredSkills": [
      "69e47d46b45b1bb5e5f9130c",
      "69e47d46b45b1bb5e5f91316",
      "69e482591f19b056ccbeb2b8",
      "69e482591f19b056ccbeb2b9"
    ],
    "preferredSkills": [
      "69e47d46b45b1bb5e5f9131f",
      "69e482581f19b056ccbeb2b3",
      "69e47d46b45b1bb5e5f9135f",
      "69e482581f19b056ccbeb2b4"
    ],
    "requiredEducation": "4th-year student or recent graduate with a Bachelor's degree in Information Technology, Computer Science, Software Engineering, or a related field, with less than one (01) year of experience. ",
    "minGpa": 7.5,
    "requiredLanguages": [
      "English"
    ],
    "minMonthsExperience": 3,
    "portfolioExpected": "Có GitHub hoặc portfolio chứa các dự án web frontend"
  }
}
*/

