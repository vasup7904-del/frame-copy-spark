import type { Resume } from "./types";
import { defaultDesign } from "./defaults";
import { makeContact } from "./header";

/** Fixed sample content used ONLY for template gallery previews — never saved. */
export function sampleResume(template: string): Resume {
  const design = { ...defaultDesign(), template };
  return {
    id: "sample",
    name: "Sample",
    header: {
      fullName: "Vasu Patel",
      headline: "Data Scientist | M.Tech Data Science",
      contacts: [
        makeContact("email", "vasu@email.com"),
        makeContact("phone", "+91 98765 43210"),
        makeContact("location", "Chennai, India"),
        makeContact("github", "GitHub", "https://github.com/", { row: 2 }),
        makeContact("linkedin", "LinkedIn", "https://linkedin.com/", { row: 2 }),
        makeContact("leetcode", "LeetCode", "https://leetcode.com/", { row: 2 }),
      ],
    },
    sections: [
      {
        id: "s1",
        kind: "summary",
        title: "Professional Summary",
        visible: true,
        text: "Data scientist with experience in Python, machine learning, data analytics and predictive modeling. Comfortable turning messy data into clear dashboards and production-ready models.",
      },
      {
        id: "s2",
        kind: "experience",
        title: "Work Experience",
        visible: true,
        items: [
          {
            id: "e1",
            role: "Data Analyst",
            company: "Example Company",
            location: "Chennai",
            start: "2025",
            current: true,
            bullets: [
              "Built analytical dashboards and predictive models for business teams.",
              "Improved reporting workflows using Python and SQL.",
              "Automated weekly data-quality checks across core datasets.",
            ],
          },
          {
            id: "e2",
            role: "Data Science Intern",
            company: "Sample Labs",
            location: "Remote",
            start: "2024",
            end: "2024",
            bullets: [
              "Cleaned and explored customer datasets with Pandas and NumPy.",
              "Prototyped classification models and presented findings to the team.",
            ],
          },
        ],
      },
      {
        id: "s3",
        kind: "education",
        title: "Education",
        visible: true,
        items: [
          {
            id: "d1",
            degree: "M.Tech",
            field: "Data Science",
            school: "SRM Institute of Science and Technology",
            start: "2023",
            end: "2025",
          },
        ],
      },
      {
        id: "s4",
        kind: "skills",
        title: "Skills",
        visible: true,
        items: [
          { id: "k1", label: "Languages", items: ["Python", "SQL"] },
          { id: "k2", label: "Libraries", items: ["Pandas", "NumPy", "scikit-learn"] },
          { id: "k3", label: "Methods", items: ["Machine Learning", "Statistics", "Data Visualisation"] },
        ],
      },
      {
        id: "s5",
        kind: "projects",
        title: "Projects",
        visible: true,
        items: [
          {
            id: "p1",
            name: "Customer Churn Prediction",
            technologies: ["Python", "scikit-learn"],
            bullets: ["Built a machine learning model to predict customer churn."],
          },
          {
            id: "p2",
            name: "Sales Forecast Dashboard",
            technologies: ["SQL", "Power BI"],
            bullets: ["Designed an interactive dashboard tracking monthly sales trends."],
          },
        ],
      },
      {
        id: "s6",
        kind: "certifications",
        title: "Certifications",
        visible: true,
        items: [{ id: "c1", title: "Machine Learning Specialization", subtitle: "Online course", date: "2024" }],
      },
    ],
    design,
    createdAt: 0,
    updatedAt: 0,
  };
}
