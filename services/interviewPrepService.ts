import { analyzeAtsSync } from './atsEngine';

export interface StarPoints {
  situation: string;
  action: string;
  result: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  competency: string;
  question: string;
  star: StarPoints;
}

/**
 * Generates 5 match-grounded interview questions with structured STAR talking points
 * derived directly from the candidate's resume facts, target job requirements, and ATS analysis.
 */
export function generateInterviewQuestions(
  resumeText: string,
  jobText: string,
  companyName?: string
): InterviewQuestion[] {
  const company = companyName?.trim() || 'the target organization';
  const ats = analyzeAtsSync(resumeText, jobText);

  const topMatched = ats.matched_keywords.slice(0, 3);
  const primarySkill = topMatched[0] || 'core software engineering';
  const secondarySkill = topMatched[1] || 'system design';
  const tertiarySkill = topMatched[2] || 'cross-functional collaboration';

  const missingSkill = ats.missing_keywords[0] || 'emerging ecosystem tooling';
  const topMetric = ats.sample_metrics[0] || 'measurable latency and throughput gains';

  return [
    {
      id: 'q1',
      category: 'Technical Architecture & Domain Mastery',
      competency: `${primarySkill.toUpperCase()} & Technical Execution`,
      question: `How have you leveraged ${primarySkill} in your previous projects, and how will that experience translate to scaling systems at ${company}?`,
      star: {
        situation: `In prior engagements, faced complex delivery requirements demanding high availability and rigorous ${primarySkill} implementation.`,
        action: `Spearheaded architectural decisions, utilizing ${primarySkill} alongside ${secondarySkill} to standardize coding standards and eliminate delivery bottlenecks.`,
        result: `Successfully deployed hardened production services resulting in ${topMetric}, directly accelerating team velocity.`,
      },
    },
    {
      id: 'q2',
      category: 'Quantifiable Impact & Performance',
      competency: 'Data-Driven Outcomes & Engineering Rigor',
      question: `Can you walk us through a high-stakes initiative where your technical contributions directly produced measurable business or system impact?`,
      star: {
        situation: `Encountered legacy bottlenecks where latency, stability, or pipeline throughput failed to meet growing user demand.`,
        action: `Audited bottlenecks end-to-end, introduced targeted optimizations leveraging ${primarySkill}, and automated verification gates.`,
        result: `Delivered verified gains highlighted on your resume (${topMetric}), establishing reliable benchmarks across the service lifecycle.`,
      },
    },
    {
      id: 'q3',
      category: 'Adaptability & Growth Edge',
      competency: `Ramping on ${missingSkill.toUpperCase()}`,
      question: `The job specifications emphasize experience with ${missingSkill}. How do you approach rapidly mastering and deploying technologies that you haven't primarily used before?`,
      star: {
        situation: `Recognized that modern engineering environments frequently require adopting adjacent frameworks and specialized tooling like ${missingSkill}.`,
        action: `Demonstrated track record of rapidly dissecting technical documentation, prototyping proof-of-concepts, and translating deep foundations in ${primarySkill} to master new paradigms.`,
        result: `Consistently achieved full autonomy on new toolchains within days, ensuring zero project slippage or quality compromise.`,
      },
    },
    {
      id: 'q4',
      category: 'Cross-Functional Leadership & Collaboration',
      competency: `${tertiarySkill.toUpperCase()} & Engineering Culture`,
      question: `Tell us about a time you had to align competing priorities between engineering, product, and leadership stakeholders to deliver a major milestone.`,
      star: {
        situation: `Managed high-priority roadmap deliverables with tight deadlines and divergent stakeholder expectations.`,
        action: `Facilitated transparent technical design reviews, grounded trade-offs in quantitative data, and maintained clear documentation.`,
        result: `Delivered the release on schedule with unanimous stakeholder sign-off, fostering team trust and long-term codebase maintainability.`,
      },
    },
    {
      id: 'q5',
      category: 'Company & Strategic Vision',
      competency: `Strategic Fit at ${company}`,
      question: `What excites you most about solving engineering challenges at ${company}, and what is your 90-day plan upon joining the team?`,
      star: {
        situation: `Assessed ${company}'s current trajectory and recognized how candidate domain background aligns with the team's engineering mission.`,
        action: `First 30 days: Deep-dive codebase, onboard environments, and ship quick-win improvements; 60 days: Own critical feature streams in ${primarySkill}; 90 days: Mentor peers and drive architectural roadmaps.`,
        result: `Ensure immediate, self-directed contribution and long-term architectural stewardship from day one.`,
      },
    },
  ];
}
