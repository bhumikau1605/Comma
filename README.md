# Comma - A Smart Community Marketplace

## Buy. Sell. Belong.

Comma is a community-based marketplace mobile application that enables users to buy, sell, donate, and exchange products within trusted communities such as colleges, residential societies, and hobby groups.

Unlike traditional marketplace platforms that connect strangers across large geographical areas, Comma focuses on building trust by restricting interactions to verified community members. The platform combines marketplace functionality with social networking features, real-time communication, and gamification mechanisms to create a secure and engaging ecosystem for peer-to-peer commerce.

---

## Problem Statement

Existing online marketplaces often face challenges such as:

* Lack of trust between buyers and sellers
* Fraudulent activities and scams
* Anonymous transactions
* Communication barriers
* Irrelevant listings from distant locations
* Low transaction success rates

Comma addresses these challenges by creating closed-community marketplaces where users interact only with members of their trusted communities.

---

## Features

### User Management

* User Registration
* Secure Login & Authentication
* User Profiles
* Session Persistence

### Community Management

* Create Communities
* Join Communities using Invite Codes
* Community Membership Management
* Community-Based Marketplace Access

### Marketplace Features

* Create Product Listings
* Edit Listings
* Delete Listings
* Mark Items as Sold
* Mark Items as Donated
* Anonymous Posting Option

### Search & Discovery

* Search Products
* Category Filters
* Price Filters
* Sorting Options

### Real-Time Communication

* Buyer-Seller Chat
* Offer Negotiation
* Instant Messaging
* Conversation History

### Reviews & Ratings

* Seller Ratings
* User Reviews
* Average Rating Calculation

### Wishlist

* Save Listings
* Manage Favorite Products

### Gamification

* Points System
* Achievement Badges
* Community Leaderboards
* Daily Rewards

### Barcode Scanning

* Product Identification
* Auto-fill Product Details

---

## Sustainability Goals

Comma contributes towards multiple United Nations Sustainable Development Goals (SDGs):

### SDG 12 – Responsible Consumption and Production

* Encourages reuse and resale of products
* Promotes donation of usable goods
* Reduces unnecessary waste generation

### SDG 11 – Sustainable Cities and Communities

* Strengthens local community interactions
* Encourages resource sharing within trusted groups

### SDG 1 – No Poverty

* Provides affordable access to second-hand products
* Supports donation-based distribution of useful items

### SDG 13 – Climate Action

* Reduces environmental impact by extending product life cycles
* Minimizes waste sent to landfills

---

## Technology Stack

### Frontend

* React Native
* Expo SDK 54
* React Navigation
* React Context API
* AsyncStorage

### Backend

* Appwrite Cloud

### Database

* Appwrite Database Collections

### Storage

* Appwrite Cloud Storage

### Development Tools

* Visual Studio Code
* Node.js
* npm
* Git & GitHub

---

## Application Architecture

```text
User
 │
 ▼
React Native Application
 │
 ├── Authentication
 ├── Communities
 ├── Listings
 ├── Chat & Offers
 ├── Wishlist
 └── Gamification
 │
 ▼
Appwrite Cloud
 │
 ├── Authentication
 ├── Database
 ├── Storage
 └── Realtime Services
```

---

## Database Collections

### Profiles

Stores:

* User Information
* Points
* Badges
* Community Memberships

### Communities

Stores:

* Community Details
* Invite Codes
* Member Information

### Listings

Stores:

* Product Information
* Pricing Details
* Item Status
* Category Information

### Messages

Stores:

* Chat History
* Conversation Records

### Offers

Stores:

* Negotiation Offers
* Offer Status

### Reviews

Stores:

* Seller Ratings
* User Feedback

### Transactions

Stores:

* Reward Points
* Activity Logs

### Follows

Stores:

* Social Connections
* Follower Relationships

---

## Gamification System

Users earn points for participating in marketplace activities.

| Activity       | Points |
| -------------- | ------ |
| Create Listing | +10    |
| Buy Item       | +15    |
| Sell Item      | +20    |
| Donate Item    | +25    |

Users can:

* Unlock Badges
* Increase Levels
* Compete on Leaderboards
* Earn Community Recognition

---

## Future Enhancements

### Artificial Intelligence

* AI Product Description Generation
* AI Category Detection
* AI Price Recommendations
* Fraud Detection System

### Platform Improvements

* Push Notifications
* Payment Gateway Integration
* QR-Based Community Joining
* Admin Dashboard
* Analytics Dashboard
* Advanced Search Recommendations

### Community Features

* College Email Verification
* Event-Based Community Groups
* Community Moderation Tools

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/comma-marketplace.git
cd comma-marketplace
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npx expo start
```

### Run on Device

1. Install Expo Go on Android/iOS
2. Scan the generated QR code
3. Launch the application

---

## Project Team

### B.M.S College of Engineering

* Bhavana K S (1BM24CS070)
* Bhavani (1BM24CS071)
* Bhumika Shrinivas Teli (1BM24CS072)
* Bhumika U (1BM24CS073)
* Bukkapatnam Varshyara (1BM24CS075)

### Guide

Prashant Koparde
Assistant Professor
Department of Computer Science and Engineering
B.M.S College of Engineering

---

## Conclusion

Comma demonstrates how community-driven marketplaces can provide a safer, more engaging, and sustainable alternative to traditional online commerce platforms. By integrating trusted communities, real-time communication, gamification, and cloud-based infrastructure, the application promotes responsible consumption while fostering meaningful community interactions.
