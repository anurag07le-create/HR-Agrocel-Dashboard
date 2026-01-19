export const requirementIntakeData = [
    {
        Role: "AI-ML Developer",
        Salary: "2 Years", // Note: CSV had "2 Years" in Salary column, likely a mismatch in user's sheet or my reading. I'll stick to what I saw or fix it.
        // Wait, CSV said: Role,Salary,Range,Urgency,Location,Status
        // AI-ML Developer,2 Years,40000 to 50000 INR,Yes,Ahmedabad,JD APPROVED
        // "2 Years" looks like Experience. "40000 to 50000 INR" is Range/Salary.
        // I will adjust keys to be more logical but keep data.
        Experience: "2 Years",
        Range: "40000 to 50000 INR",
        Urgency: "Yes",
        Location: "Ahmedabad",
        Status: "JD APPROVED"
    }
];

export const jdData = [
    {
        Role: "AI-ML Developer",
        Experience: "2 Years",
        JobDescriptionLink: "https://docs.google.com/document/d/1...", // Placeholder
        JobDescriptionImage: "https://via.placeholder.com/150", // Placeholder
        Status: "Active"
    },
    {
        Role: "Frontend Developer",
        Experience: "3 Years",
        JobDescriptionLink: "https://docs.google.com/document/d/1...",
        JobDescriptionImage: "https://via.placeholder.com/150",
        Status: "Draft"
    }
];

export const logData = [
    {
        Date: "2025-12-01",
        Action: "JD Approved",
        User: "Admin",
        Details: "AI-ML Developer JD approved."
    },
    {
        Date: "2025-11-30",
        Action: "Requirement Added",
        User: "HR Manager",
        Details: "New requirement for AI-ML Developer."
    }
];

export const shortlistData = [
    {
        Date: "2025-12-01",
        Candidates: [
            { Name: "John Doe", Role: "AI-ML Developer", Score: 85, Status: "Shortlisted" },
            { Name: "Jane Smith", Role: "AI-ML Developer", Score: 92, Status: "Interview Scheduled" }
        ]
    },
    {
        Date: "2025-11-28",
        Candidates: [
            { Name: "Alice Johnson", Role: "Frontend Developer", Score: 78, Status: "Rejected" }
        ]
    }
];
