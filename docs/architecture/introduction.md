# Introduction

This document outlines the architectural approach for enhancing **Centaurus Drum Machine** with **APC40 MIDI hardware controller integration with real-time LED feedback and modular hardware abstraction layer**. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**  
This document supplements existing project architecture by defining how new hardware abstraction components will integrate with the current React/TypeScript/Tone.js system. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing the hardware controller enhancement.

## Existing Project Analysis

**Current Project State**:
- **Primary Purpose**: Web-based drum sequencer with educational features and visual feedback
- **Current Tech Stack**: React 18.2.0 + TypeScript, Vite build tool, Tone.js 15.1.22 audio engine, Tailwind CSS design system
- **Architecture Style**: Component-based React architecture with singleton audio engine pattern, event-driven audio scheduling
- **Deployment Method**: Static web application built with Vite, no server-side dependencies

**Available Documentation**:
- TypeScript interfaces defined in `src/types/index.ts`
- Component architecture evident from organized folder structure
- Audio engine singleton pattern in `src/utils/audioEngine.ts`
- Color mapping system for visual feedback
- Educational mode implementation demonstrating extensible architecture

**Identified Constraints**:
- Browser-only deployment (no server infrastructure)
- Tone.js timing precision requirements for audio synchronization
- React state management patterns must be maintained
- Mobile responsiveness requirements (existing Tailwind implementation)
- No existing external API dependencies (purely client-side application)

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|---------|
| Initial Architecture Creation | 2025-09-25 | 1.0 | Created comprehensive architecture for APC40 hardware integration | Winston (BMad Architect Agent) |
