# POWR - Social Fitness on Nostr

[![Open Source](https://img.shields.io/badge/Open%20Source-MIT-blue.svg)](LICENSE)
[![Nostr Protocol](https://img.shields.io/badge/Protocol-Nostr-purple.svg)](https://nostr.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](public/manifest.json)
[![Social Fitness](https://img.shields.io/badge/Social-Fitness-orange.svg)](https://nostr.com)

A **social fitness tracking** Progressive Web App built on the Nostr protocol. Track your workouts, share your progress, discover new exercises, and connect with the fitness community - all while controlling your own data through Nostr.

## 🏋️ **Social Fitness on Nostr**

POWR brings social fitness to the decentralized web through Nostr. Share workouts, discover exercises from other users, and build a fitness community where you own your data.

### **Key Features**
- 💪 **Complete Workout Tracking** - Templates, active sessions, and detailed history
- 🤝 **Social Discovery** - Find workouts and exercises shared by the community  
- 📱 **Offline-First PWA** - Full functionality without internet connection
- 🔐 **Data Ownership** - Your fitness data belongs to you via Nostr keys
- ⚡ **Real-Time Sync** - Seamless sync across devices and apps
- 🌐 **Cross-App Compatible** - Works with any Nostr fitness application

## 🌟 **Why Social Fitness on Nostr?**

### **🏋️ For Fitness Enthusiasts**
- **Own Your Data**: Your workout history, PRs, and progress belong to you
- **Community Driven**: Discover workouts and exercises from real users
- **Cross-Platform**: Use your data with any Nostr-compatible fitness app
- **Privacy First**: Share what you want, keep private what you don't

### **🤝 For the Fitness Community**
- **Share Knowledge**: Publish your favorite workouts and exercises
- **Discover Content**: Find new routines from trainers and athletes
- **Build Together**: Contribute to an open fitness ecosystem
- **No Vendor Lock-in**: Community content isn't trapped in one app

### **🔧 For Developers**
- **Open Protocol**: Build on Nostr's decentralized foundation
- **Modern Stack**: Next.js, TypeScript, XState, and Radix UI
- **Proven Architecture**: Efficient, scalable, and maintainable codebase
- **Comprehensive Documentation**: Learn from real-world implementation

## 🚀 **Live Demo & Quick Start**

### **Try the Application**
- **Live Demo**: [Coming Soon - Vercel Deployment]
- **Local Development**: Clone and run `npm run dev`
- **PWA Installation**: Visit in mobile browser and "Add to Home Screen"

### **Quick Start for Developers**
```bash
# Clone the repository
git clone https://github.com/DocNR/powr_web.git
cd powr_web

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🏗️ **How It Works**

### **Nostr-Native Fitness Data**
```
Workout Templates (NIP-101e) ←→ Exercise Library ←→ Community Sharing
        ↓                              ↓                    ↓
Active Workouts (XState)        Real-Time Tracking    Social Discovery
        ↓                              ↓                    ↓
Workout Records (Nostr)         Performance History   Cross-App Sync
```

### **Social Features**
- **Exercise Templates**: Community-created exercises with proper form and muscle targeting
- **Workout Templates**: Complete routines shared by trainers and experienced users
- **Workout Records**: Your personal training history and achievements
- **Collections**: Curated content for specific goals (strength, cardio, flexibility)

## 🛠️ **Tech Stack**

### **Core Framework**
- **Next.js 14** (App Router) - Modern React framework with SSR/SSG
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first styling with custom design system

### **State Management**
- **XState v5** - Complex workout state machines with hierarchical states
- **NDK React Hooks** - Official Nostr Development Kit React integration
- **Radix UI** - Accessible component primitives for enterprise UI

### **Nostr Integration**
- **NDK Core** - Nostr Development Kit for web browsers
- **NDK Cache Dexie** - IndexedDB caching adapter for offline-first functionality
- **NIP-101e Compliance** - Fitness event specification implementation
- **NIP-51 Collections** - Content organization and discovery

### **PWA Features**
- **Service Worker** - Offline functionality and background sync
- **Web App Manifest** - Native app-like installation experience
- **IndexedDB Persistence** - Client-side data storage and caching

## 📦 **Installation & Dependencies**

### **Core Dependencies**
```bash
# Nostr Development Kit
npm install @nostr-dev-kit/ndk @nostr-dev-kit/ndk-cache-dexie

# State Management
npm install xstate @xstate/react

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-progress
npm install @radix-ui/react-separator @radix-ui/react-switch

# Utilities
npm install uuid @types/uuid clsx tailwind-merge
```

### **Development Dependencies**
```bash
# Next.js and TypeScript
npm install next react react-dom typescript @types/react @types/node

# Styling
npm install tailwindcss postcss autoprefixer

# Development Tools
npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## 🎯 **Workout Flow & Features**

### **Complete Workout Lifecycle**
```
Browse Templates (33402) → Setup Workout (XState) → Track Sets/Reps (XState) → Publish Record (1301)
```

### **Key Features**
- **Template Browser**: Curated workout templates with exercise dependencies
- **Active Workout Tracking**: Real-time set/rep/weight/RPE tracking
- **Workout History**: Complete workout records with performance analytics
- **Exercise Library**: Comprehensive exercise database with muscle group categorization
- **Social Features**: Share workouts and discover content from other users

### **NIP-101e Event Types**
- **Kind 33401**: Exercise Templates (addressable events)
- **Kind 33402**: Workout Templates (addressable events)  
- **Kind 1301**: Workout Records (standard events)
- **Kind 30003**: Collections (NIP-51 content organization)

## 📊 **Performance & Reliability**

### **Optimized for Fitness**
- **Fast Template Loading**: Sub-second workout template access
- **Offline Workouts**: Complete workout tracking without internet
- **Real-Time Sync**: Instant updates across devices when online
- **Efficient Caching**: Smart data management for smooth experience
- **Cross-Session Persistence**: Your data survives app restarts

### **Built for Scale**
- **Community Content**: Efficiently handles thousands of shared workouts
- **Social Discovery**: Fast search and filtering of community content
- **Multi-Device Sync**: Seamless experience across phone, tablet, and desktop
- **Minimal Footprint**: Efficient storage and memory usage

## 🌐 **Nostr Protocol Integration**

### **Relay Strategy**
Production relays for real-world testing:
- `wss://relay.damus.io` - Primary relay (reliable, fast)
- `wss://nos.lol` - Secondary relay (good performance)
- `wss://relay.primal.net` - Tertiary relay (Nostr-native)

### **Authentication Methods**
- **NIP-07 Browser Extensions** (Recommended) - Alby, nos2x, etc.
- **Private Key Fallback** - Encrypted storage with Web Crypto API
- **User Data Ownership** - Users control all data with their Nostr keys

### **Cross-App Compatibility**
All workout data is stored as standard Nostr events, making it compatible with any Nostr-based fitness application. Users own their data and can migrate between applications freely.

## 🧪 **Testing & Validation**

### **Comprehensive Test Suite**
- **Real-World Testing**: Actual content creation and dependency resolution
- **Performance Benchmarking**: Measured timing under realistic conditions
- **Cross-Account Validation**: Fresh accounts subscribing to existing content
- **Offline Testing**: Complete functionality without network connectivity
- **Persistence Testing**: Data survival across browser restarts

### **Test Components**
- `WorkflowValidationTest` - Complete end-to-end workout flow
- `WorkoutListManager` - Dependency resolution with batched optimization
- `Phase1ContentVerificationTest` - NIP-101e/NIP-51 compliance validation
- `ActiveWorkoutNIP101eTest` - Real-time workout tracking validation

## 🤝 **Open Source Contribution**

### **How to Contribute**
1. **Fork the repository** and create a feature branch
2. **Follow the development guidelines** in `.clinerules/`
3. **Add tests** for new functionality
4. **Submit a pull request** with clear description

### **Development Guidelines**
- **Architecture Patterns**: Follow `.clinerules/` for established patterns
- **Code Quality**: TypeScript strict mode, ESLint compliance
- **Testing**: Add test components for new features
- **Documentation**: Update relevant docs for architectural changes

### **Areas for Contribution**
- **UI/UX Improvements**: Enhanced workout interfaces and user experience
- **Performance Optimization**: Further NDK cache and query optimizations
- **Feature Extensions**: Additional workout types, analytics, social features
- **Documentation**: Tutorials, guides, and architectural explanations
- **Testing**: Expanded test coverage and validation scenarios

## 📚 **Documentation**

### **Core Documentation**
- **[Architecture Validation](./docs/ndk-first-architecture-validation.md)** - Complete validation results and migration guidance
- **[Project Kickoff](./docs/project-kickoff.md)** - Original project goals and development plan
- **[NIP-101e Specification](./docs/nip-101e-specification.md)** - Fitness event specification for Nostr protocol

### **Development Guidelines**
- **[.clinerules/README.md](./.clinerules/README.md)** - Smart navigation for development rules
- **[NDK Best Practices](./.clinerules/ndk-best-practices.md)** - Official NDK patterns and integration
- **[XState Anti-Patterns](./.clinerules/xstate-anti-pattern-prevention.md)** - State management best practices

### **Research & Analysis**
- **[NDK Cache Validation](./docs/ndk-cache-validation-results.md)** - Performance and persistence validation
- **[Dependency Resolution](./docs/research/ndk-tag-deduplication-solution.md)** - Complex dependency resolution patterns

## 🔮 **Future Roadmap**

### **Phase 1: Enhanced Features** (Next)
- **Advanced Analytics**: Performance trends and recommendations
- **Social Features**: Following, sharing, competitions
- **Mobile Optimization**: Enhanced PWA experience
- **Content Curation**: Premium workout and exercise libraries

### **Phase 2: Platform Expansion** (Future)
- **Native Mobile Apps**: React Native versions for iOS and Android
- **Multi-Sport Support**: Running, cycling, yoga, and other activities
- **AI Integration**: Personalized recommendations and coaching
- **Enterprise Features**: Team management and gym integrations

## 📄 **License & Legal**

### **Open Source License**
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **Data Ownership**
- **User Data**: Users own all their data through Nostr private keys
- **Content**: Exercise templates and workout data are publicly shared via Nostr
- **Privacy**: All data is published to public Nostr relays (currently unencrypted)
- **Portability**: Users can export/import data to any Nostr-compatible application

## 🌟 **Why Choose POWR?**

### **For Fitness Enthusiasts**
- **Own Your Progress**: Your workout data belongs to you, not a company
- **Community Driven**: Learn from real users, not just corporate content
- **Works Everywhere**: Use your data with any Nostr fitness app
- **Privacy Control**: Share publicly or keep workouts private

### **For Content Creators**
- **Share Your Knowledge**: Publish workouts and exercises to help others
- **Build Your Following**: Connect with users who love your content
- **Monetization Ready**: Foundation for premium content and coaching
- **Cross-Platform Reach**: Your content works in all Nostr fitness apps

### **For Developers**
- **Modern Tech Stack**: Next.js, TypeScript, XState, and Radix UI
- **Open Source**: Learn from and contribute to the codebase
- **Nostr Ecosystem**: Build on the future of decentralized social

## 🚀 **Get Started Today**

Whether you're a **fitness enthusiast** looking to own your workout data, a **developer** interested in Nostr applications, or a **content creator** wanting to share your fitness knowledge, POWR provides the foundation for social fitness on the decentralized web.

**Join the social fitness revolution on Nostr.**

---

**Repository**: https://github.com/DocNR/powr_web  
**License**: MIT  
**Protocol**: Nostr  
**Focus**: Social Fitness  
**Status**: Production Ready  
**Community**: Open Source Contributors Welcome
