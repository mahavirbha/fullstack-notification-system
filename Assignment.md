# Fullstack React Native Developer - Technical Assignment

## Overview

Build a cross-platform notification system demonstrating your expertise in database design, system architecture, and React Native development.

**Deliverables:** Database schemas, architecture diagram, React Native app source code

## Why this assignment?

We have designed this assignment to evaluate your full-stack capabilities spanning database design, system architecture, and mobile development. We believe this is also a valuable opportunity for you to learn and explore new technologies or architectural patterns that you might not encounter in your day-to-day work.

## Time & Usage Guidelines

- **Time Expectation:** We value your time and do not expect you to spend more than 2-3 hours on this assignment. Focus on the core requirements rather than perfection.
- **AI Usage:** You are free to use AI tools (ChatGPT, Copilot, etc.) to assist with boilerplate or syntax. However, it is important that you truly understand the requirements, make reasonable assumptions, and are able to explain your choices and trade-offs in the subsequent rounds of interviews.

## Task 1: Database Design

### Problem Statement

You are designing the data layer for a notification system that sends messages to users via Push, Email, and In-App channels. The system needs to support different types of messages (e.g., transactional, marketing, alerts) and must track the delivery status of each message individually for every channel (e.g., a push might "fail" while the email for the same notification is "delivered").

### Requirements

- **Schema Design:** Propose a MongoDB schema structure to handle the storage of notifications and the tracking of their delivery status across different channels.
- **Indexing:** Identify 2-3 critical indexes needed for performance and explain why.

### Deliverables

- Schema definitions (Fields, Types, Required/Optional).
- List of Indexes with reasoning.

## Task 2: System Architecture

### Problem Statement

You need to architect the backend for this notification system. The system must serve React Native (Mobile) and React (Web) clients. It must handle high volumes of outbound traffic, support real-time updates, and gracefully handle users who are currently offline.

### Requirements

**Architecture Diagram:** Design a high-level diagram showing the flow of a notification from creation to delivery. Ensure you account for the following constraints:

- Sending notifications (Push/Email) is slow and unreliable; the main API should not block while waiting for these providers.
- Real-time updates are required for the Web client.
- Mobile apps rely on Push notifications when the app is closed.
- The system must scale to handle traffic spikes.

### Deliverables

- Architecture diagram (Image/PDF).

## Task 3: React Native Mobile App

### Objective

Build a React Native app displaying a notification list with search, pagination, and a detail view.

### Core Features

#### 1. Notifications List Screen

- **Display:** List showing Type Badge (color-coded: Blue, Green, Red, Purple), Title, Body (truncated), Timestamp (relative), and Read Status.
- **Search:** Search input with 400ms debounce filtering by title or body.
- **Details:** Tapping a notification opens a simple popup or toast with details.
- **Pagination:** Implement either Infinite Scroll or a "Load More" button.
- **Mock Data:** Generate at least 50-100 mock notifications with a simulated 300ms network delay.
- **Performance:** Ensure smooth scrolling using FlatList.

### Technical Requirements

- **Framework:** Expo (Recommended).
- **Language:** JavaScript or TypeScript.
- **Navigation:** React Navigation or Expo Router.

### Running the App

You must provide clear instructions in the README.md on how to run the app locally.

### Deliverables

- **Source Code:** GitHub repository or ZIP file.
- **README.md:**
    - Instructions on how to run the app locally.
    - Short explanation of technical decisions (e.g., pagination choice).

## Task 4: React Admin Panel [OPTIONAL]

Build a simple React web admin panel to manage these notifications.

- **List View:** Table view of notifications.
- **Actions:** A "Resend" button (mocked).
- **Create:** A simple form to add a new notification (mocked).
- **Deployment:** Host live (e.g., Vercel).

## Submission Guidelines

**Format:** GitHub Repository (Preferred) or ZIP file.

**Structure:**

```
task1-database/
task2-architecture/
task3-mobile-app/ (Include README with local run instructions here)
task4-admin-panel/ (Optional)
```

**Reply Instructions:**

Please reply to the assignment email with the link to your repository or the attached ZIP file.

## Evaluation Criteria

- **System Design:** Logical reasoning in DB and Architecture choices (Did they solve the constraints?).
- **Functionality:** Search, pagination, and detail view work as expected in the app.
- **Code Quality:** Clean and readable code.
