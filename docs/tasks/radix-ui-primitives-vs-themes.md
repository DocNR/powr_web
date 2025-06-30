# Radix UI: Primitives vs Themes Research Prompt

## Research Objective
I need to make an informed architectural decision between Radix UI Primitives + Tailwind vs Radix UI Themes for a fitness PWA with aggressive white labeling requirements. Please help me analyze both approaches against specific business and technical criteria.

## Business Context
- **Product**: POWR Workout PWA built with NextJS
- **Business Model**: White label platform for gyms with distinct "personalities"
- **White Label Requirements**: 
  - Zen gyms (rounded, soft, calming)
  - Hardcore gyms (sharp, bold, aggressive) 
  - Corporate gyms (clean, minimal, professional)
  - Boutique gyms (elegant, refined, premium)
- **Technical Stack**: NextJS 14, TypeScript, Tailwind CSS, XState, NDK
- **Deployment**: PWA-first with potential Capacitor mobile conversion

## Specific Research Questions

### 1. Theme Customization Depth
**Question**: How deep can Radix Themes be customized? Can I achieve completely different visual personalities (zen vs hardcore) or am I limited to color/typography variations?

**What I need to know**:
- Can Radix Themes support completely different border radius strategies? (zen = rounded, hardcore = sharp)
- How flexible are shadow systems? (zen = subtle, hardcore = heavy)
- Can I customize spacing, sizing, and layout patterns per theme?
- Are there examples of Radix Themes supporting dramatically different design languages?

### 2. CSS Custom Properties Integration
**Question**: How do Radix Themes handle dynamic theming with CSS custom properties compared to Radix Primitives?

**What I need to know**:
- Does Radix Themes support CSS custom property overrides?
- Can I switch between gym personalities at runtime without JavaScript re-renders?
- How does theme switching performance compare between approaches?
- Can I maintain SEO-friendly server-side rendering with dynamic themes?

### 3. Component Override Flexibility
**Question**: When using Radix Themes, how easy is it to override components that don't fit my gym personality requirements?

**What I need to know**:
- Can I easily override individual components while keeping the theme system?
- How much CSS specificity fighting is required for deep customizations?
- Are there examples of heavily customized Radix Themes implementations?
- What's the maintenance burden when Radix Themes updates vs Primitives?

### 4. Bundle Size and Performance
**Question**: What are the bundle size and performance implications of each approach?

**What I need to know**:
- Radix Themes bundle size vs individual Primitives for my use case
- Tree-shaking effectiveness with each approach
- Runtime performance for theme switching
- Impact on PWA loading performance (my target is <272ms template loading)

### 5. TypeScript and Developer Experience
**Question**: How do the TypeScript experiences compare for my white labeling use case?

**What I need to know**:
- Type safety for custom theme tokens and variants
- IntelliSense support for gym personality variants
- Component prop typing flexibility
- Developer ergonomics for building new components

### 6. Enterprise Stability and Maintenance
**Question**: Which approach provides better long-term stability for a white label business?

**What I need to know**:
- Update frequency and breaking change patterns for each approach
- Community vs official maintenance (dependency chain risks)
- Backwards compatibility guarantees
- Migration path complexity when either approach changes

### 7. Real-World White Label Examples
**Question**: Are there production examples of either approach successfully supporting multiple brand personalities?

**What I need to know**:
- Companies using Radix Themes for white labeling
- Companies using Radix Primitives + custom theming for similar use cases
- Success stories and pain points from both approaches
- Performance benchmarks from real implementations

## Decision Criteria Priority
Please help me evaluate both approaches against these weighted criteria:

1. **White Label Flexibility (40%)**: Can I create distinctly different gym personalities?
2. **Performance (25%)**: Bundle size, runtime performance, theme switching speed
3. **Developer Experience (20%)**: TypeScript, maintainability, component building ease
4. **Enterprise Stability (10%)**: Long-term maintenance, update safety
5. **Implementation Speed (5%)**: Time to first working prototype

## Expected Deliverable
Based on your research, please provide:

1. **Comparative Analysis**: Side-by-side evaluation of both approaches
2. **Recommendation**: Which approach better serves my white labeling goals
3. **Implementation Strategy**: If recommending Themes, how to achieve gym personalities; if Primitives, validation of current approach
4. **Risk Assessment**: What could go wrong with each approach for my use case
5. **Proof of Concept Plan**: Next steps to validate the recommended approach

## Context for MCP Tool Usage
I have access to official Radix UI documentation, GitHub repositories, and community discussions. Please use these resources to provide evidence-based analysis rather than general assumptions about the approaches.

Thank you for helping me make this critical architectural decision for the POWR platform!