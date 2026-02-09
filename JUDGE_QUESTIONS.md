# UGAHacks 2026 - Judge Questions for WDYM86

This document contains questions that hackathon judges are likely to ask about WDYM86, organized by category. Use this to prepare comprehensive answers for your presentation.

---

## 🎯 Project Overview & Pitch Questions

1. **Can you explain WDYM86 in one sentence?**
   - Testing: Clarity of vision, communication skills

2. **What problem does this solve, and who experiences this problem?**
   - Testing: Problem identification, market awareness

3. **What does "WDYM86" stand for, and why did you choose that name?**
   - Testing: Branding, creativity

4. **How is this different from existing restaurant management software like Toast or Square?**
   - Testing: Competitive analysis, unique value proposition

5. **Walk me through a typical user workflow - how would a restaurant manager use this on a daily basis?**
   - Testing: User experience understanding, practical application

---

## 🤖 Technical Implementation - Ground-Up ML Model

6. **You mentioned building a Temporal Convolutional Network from scratch in NumPy. Why not use PyTorch or TensorFlow?**
   - Testing: Technical decision-making, understanding of ML frameworks

7. **Can you explain how your TCN architecture works? What are the key layers and operations?**
   - Testing: Deep technical knowledge, ML expertise

8. **What is a Negative Binomial distribution, and why is it appropriate for restaurant demand forecasting?**
   - Testing: Statistical knowledge, problem-specific modeling

9. **How do you handle overfitting with your ground-up model? Do you use regularization techniques?**
   - Testing: ML best practices, model robustness

10. **What's your training process? How much data do you need, and how long does it take to train?**
    - Testing: Practical ML implementation

11. **How do you validate your model's accuracy? What metrics do you use?**
    - Testing: Model evaluation, scientific rigor

12. **Can you show me the actual demand predictions vs. actuals? How accurate is your model?**
    - Testing: Real-world performance, honesty about limitations

13. **How does your model handle seasonality, holidays, and special events?**
    - Testing: Feature engineering, real-world considerations

14. **What happens when a restaurant has limited historical data? Can your model work with cold start scenarios?**
    - Testing: Edge case handling, practical deployment

---

## 🌟 Gemini API Integration

15. **You claim "Best Use of Gemini API" - what makes your integration special?**
    - Testing: API usage depth, innovation

16. **What specific Gemini features are you using? (function calling, vision, code execution, etc.)**
    - Testing: Technical breadth, feature utilization

17. **Can you demonstrate the AI Advisor in action? Ask it a complex question about your inventory.**
    - Testing: Live functionality, real-time demo

18. **How does Gemini's vision capability work with food photos? What can it analyze?**
    - Testing: Multimodal AI understanding

19. **You mentioned code execution - can you show an example where Gemini runs Python code for you?**
    - Testing: Advanced API usage

20. **What's your fallback strategy when Gemini API quota is exceeded or service is unavailable?**
    - Testing: Error handling, resilience

21. **How do you structure your prompts to get consistent, reliable responses from Gemini?**
    - Testing: Prompt engineering skills

22. **What safety measures do you have to prevent hallucinations or incorrect recommendations?**
    - Testing: AI safety awareness, responsible AI

---

## 🏗️ Architecture & Tech Stack

23. **Why did you choose FastAPI over Django or Flask for your backend?**
    - Testing: Framework knowledge, architectural decisions

24. **You have 28 routers and 130+ endpoints - can you describe your API architecture?**
    - Testing: System design, scalability awareness

25. **How does your frontend communicate with the backend? Are you using REST, GraphQL, or WebSockets?**
    - Testing: API design patterns

26. **What database are you using, and how are you managing schema migrations?**
    - Testing: Data persistence, DevOps practices

27. **You mentioned AWS integration (RDS, S3, Cognito) - is this actually deployed to AWS or local only?**
    - Testing: Deployment reality check

28. **How are you handling authentication and authorization? What's your security model?**
    - Testing: Security awareness

29. **Can you explain your three autonomous AI agents? How do they work together?**
    - Testing: AI agent architecture, multi-agent systems

---

## 💳 Payments & Integrations

30. **You support 8 payment methods including Solana Pay. Why cryptocurrency for restaurants?**
    - Testing: Innovation justification, real-world practicality

31. **Have you actually integrated with Stripe and Solana, or are these mocked?**
    - Testing: Implementation depth

32. **What about POS integrations with NCR Voyix, Toast, Square? Are these live connections?**
    - Testing: Third-party API integration reality

33. **How do you handle payment failures, refunds, and dispute resolution?**
    - Testing: Edge case handling, production readiness

34. **What's your approach to sales tax calculation with TaxJar?**
    - Testing: Compliance awareness, real-world requirements

---

## 📊 Demo & User Experience

35. **Walk me through your demo. What are the 6 cuisine templates, and how do they differ?**
    - Testing: Demo preparation, attention to detail

36. **Can I try the live demo right now? What should I do first?**
    - Testing: Demo readiness, user onboarding

37. **You have fully themed data for Greek and Japanese - what does that mean exactly?**
    - Testing: Data curation, demo quality

38. **How does the floor plan editor work? Can I redesign the restaurant layout?**
    - Testing: Interactive features, UX design

39. **Show me the Kitchen Display System (BOHPOS). How does it help kitchen staff?**
    - Testing: End-to-end workflow understanding

40. **What happens when I place an order in the POS? Does it update inventory in real-time?**
    - Testing: Data flow, system integration

41. **Your UI uses glassmorphism and dark mode. Why those design choices?**
    - Testing: Design thinking, aesthetic awareness

---

## 🚀 Business Model & Viability

42. **How would you monetize this? What's your pricing strategy?**
    - Testing: Business acumen, sustainability

43. **You show 4 pricing tiers ($49 to $399/month). Is anyone actually paying for this?**
    - Testing: Market validation, traction

44. **What's your target market? Small cafes, chain restaurants, or enterprise?**
    - Testing: Market segmentation, focus

45. **What's your customer acquisition strategy? How would restaurants find out about you?**
    - Testing: Go-to-market planning

46. **Have you talked to any real restaurant owners? What feedback did you get?**
    - Testing: User research, validation

47. **What would it take to go from hackathon project to production SaaS?**
    - Testing: Realistic planning, next steps

48. **Who are your competitors, and why would a restaurant choose you over them?**
    - Testing: Competitive analysis, differentiation

---

## 🔬 Innovation & Uniqueness

49. **What's the most technically challenging part you built during this hackathon?**
    - Testing: Technical depth, problem-solving

50. **What's the most innovative feature that sets you apart from other hackathon projects?**
    - Testing: Innovation awareness, unique value

51. **If you had one more day, what would you add or improve?**
    - Testing: Prioritization, self-awareness

52. **What did you learn building this project that you didn't know before?**
    - Testing: Growth mindset, learning ability

53. **How much of this was built during the hackathon vs. before?**
    - Testing: Honesty, scope understanding

---

## ⚡ Performance & Scalability

54. **How many concurrent users can your system handle right now?**
    - Testing: Performance awareness

55. **What happens when 1,000 restaurants are using your demand forecasting simultaneously?**
    - Testing: Scalability thinking

56. **How fast is your model inference? Can it predict demand in real-time?**
    - Testing: Performance optimization

57. **What's your database query optimization strategy for large datasets?**
    - Testing: Data engineering skills

58. **Have you done any load testing? What's your bottleneck?**
    - Testing: Production readiness

---

## 🛠️ Development Process

59. **How did you divide the work among team members?**
    - Testing: Teamwork, collaboration

60. **What was your biggest technical challenge, and how did you overcome it?**
    - Testing: Problem-solving, resilience

61. **Did you use any AI tools (GitHub Copilot, ChatGPT) to help build this?**
    - Testing: Tool usage, productivity

62. **How did you manage your time to build so many features in 48 hours?**
    - Testing: Project management, efficiency

63. **What part of the project are you most proud of?**
    - Testing: Personal investment, passion

---

## 🔮 Future Vision

64. **Where do you see this project in 6 months? 1 year?**
    - Testing: Long-term vision, commitment

65. **Would you continue working on this after the hackathon?**
    - Testing: Genuine interest, dedication

66. **What features would you add next if you had more time?**
    - Testing: Product roadmap thinking

67. **How would you handle multi-location restaurant chains?**
    - Testing: Enterprise scalability

68. **Could this work for other industries beyond restaurants (retail, hospitality)?**
    - Testing: Market expansion thinking

---

## 🐛 Edge Cases & Limitations

69. **What doesn't work yet? What are the current limitations?**
    - Testing: Honesty, self-awareness

70. **How do you handle restaurants with highly variable menus (daily specials, seasonal)?**
    - Testing: Real-world complexity

71. **What if a restaurant has multiple locations with different inventory systems?**
    - Testing: Enterprise requirements

72. **How accurate is your "disruption engine" for weather, traffic, and supply chain events?**
    - Testing: Feature realism

73. **What happens when your ML model makes a wrong prediction and a restaurant runs out of ingredients?**
    - Testing: Risk awareness, liability

---

## 🎓 UGAHacks-Specific Questions

74. **Why did you choose to compete at UGAHacks specifically?**
    - Testing: Event engagement, local connection

75. **How does your project align with UGAHacks themes or sponsor challenges?**
    - Testing: Event awareness, strategic positioning

76. **Did you use any sponsor APIs or technologies in your project?**
    - Testing: Sponsor engagement

77. **What makes your project a good fit for the "Ground-Up Model" track?**
    - Testing: Track alignment

78. **How does your project benefit the local Athens/UGA community?**
    - Testing: Local impact, community awareness

---

## 📈 Data & Privacy

79. **What data are you collecting from restaurants? How do you ensure privacy?**
    - Testing: Data ethics, GDPR/CCPA awareness

80. **How do you store and protect sensitive business data (revenue, costs, suppliers)?**
    - Testing: Security practices

81. **Can restaurants export their data? Do they own it?**
    - Testing: Data ownership, user rights

82. **How do you handle PII (Personally Identifiable Information) for customers and staff?**
    - Testing: Privacy compliance

---

## 🎨 Design & UX

83. **Who designed your UI? What tools did you use?**
    - Testing: Design process, tool knowledge

84. **How did you decide on the information architecture for your dashboard?**
    - Testing: UX thinking, user-centered design

85. **Have you conducted any user testing, even informally?**
    - Testing: Validation, user feedback

86. **Your app has 20+ pages. How do you prevent users from getting lost?**
    - Testing: Navigation design, user flow

87. **Why did you choose the UGA color scheme (red, black, white)?**
    - Testing: Branding, local connection

---

## 🔥 Rapid-Fire Technical Questions

88. **TypeScript or JavaScript? Why?**
89. **React or Vue? Why?**
90. **PostgreSQL or MongoDB? Why?**
91. **REST or GraphQL? Why?**
92. **Tailwind or styled-components? Why?**
93. **How many lines of code is this project?**
94. **How many Git commits did you make during the hackathon?**
95. **What's your test coverage percentage?**
96. **Are you using Docker? CI/CD?**
97. **What's the craziest bug you encountered?**

---

## 🏆 Closing Questions

98. **If you could only pick ONE feature to demonstrate, what would it be and why?**
    - Testing: Prioritization, persuasion

99. **What would you say to convince a skeptical restaurant owner to try your platform?**
    - Testing: Sales skills, empathy

100. **Why should WDYM86 win UGAHacks?**
     - Testing: Confidence, summarization, closing pitch

---

## 🎤 Bonus: "Gotcha" Questions Judges Might Ask

- **"This looks too polished for a 48-hour hackathon. How much was pre-built?"**
- **"Your demo is impressive, but does the backend actually work or is it all mocked data?"**
- **"Show me the actual code for your NumPy TCN. Can you explain this section?"**
- **"What happens if I click this button?" (random feature test)**
- **"Have you tested this on mobile? Pull up your phone and show me."**
- **"What's your GitHub commit history? Can I see it?"**
- **"If I gave you $100k right now, what would you do with it?"**
- **"Would you drop out of school to work on this full-time?"**

---

## 📝 Preparation Tips

1. **Know your numbers**: Accuracy metrics, lines of code, number of features, pricing
2. **Have a backup demo**: Offline mode, screen recording, slides
3. **Be honest about limitations**: Judges appreciate self-awareness
4. **Show enthusiasm**: Passion matters as much as technical skill
5. **Tell a story**: Frame your answers as narratives, not just facts
6. **Practice the 30-second elevator pitch**: You might only get 3 minutes total
7. **Prepare code deep-dives**: Be ready to explain any part of your codebase
8. **Know your teammates' contributions**: Don't say "I don't know, someone else built that"
9. **Have a "wow moment"**: One demo feature that makes judges say "that's cool!"
10. **End with a call-to-action**: "Try it now at wdym86.tech" or "We're looking for restaurant partners"

---

## 🎯 Judge Scoring Rubric (Typical Hackathon)

Understanding how judges typically score can help you prepare:

| Category | Weight | What Judges Look For |
|----------|--------|---------------------|
| **Innovation & Creativity** | 25% | Uniqueness, originality, "wow factor" |
| **Technical Complexity** | 25% | Difficulty, skill demonstration, architecture |
| **Design & UX** | 15% | Usability, aesthetics, user flow |
| **Functionality** | 20% | Does it work? How well? |
| **Business Viability** | 10% | Market potential, monetization, scalability |
| **Presentation** | 5% | Communication, demo quality, pitch |

---

## 🚀 Your Strongest Talking Points

When judges ask questions, always try to steer back to these strengths:

1. ✅ **Ground-up NumPy TCN** — Most projects use pre-built models
2. ✅ **Negative Binomial distribution** — Sophisticated statistical modeling
3. ✅ **Gemini API depth** — Function calling, vision, code execution, search grounding
4. ✅ **Three autonomous AI agents** — Multi-agent system is advanced
5. ✅ **6 fully-themed demo restaurants** — Shows attention to detail
6. ✅ **20+ functional pages** — Comprehensive, production-quality scope
7. ✅ **Real-world POS integrations** — NCR Voyix, Toast, Square
8. ✅ **8 payment methods including Solana** — Crypto innovation
9. ✅ **Location-aware disruption engine** — Context-specific intelligence
10. ✅ **Deployed and accessible** — wdym86.tech works right now

---

**Good luck at UGAHacks! 🎉🏆**
