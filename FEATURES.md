# MyTicket - Event & Ticket Management System

A modern event and ticket management platform built with Next.js and Convex.

## 🎯 Features

### Events Management

#### Create Events
- Add event name, description, date, and location
- Optional event image URL
- Events start as "draft" status

#### Event Lifecycle
- **Draft** - Work in progress, not visible to public
- **Published** - Live and accepting ticket sales
- **Cancelled** - Event cancelled, no longer active

#### Event Actions
- View all events
- Publish draft events
- Cancel published events
- Delete events (removes all associated tickets)

---

### Ticket Management

#### Multiple Ticket Types
Each event can have multiple ticket types with different:
- Names (e.g., "General Admission", "VIP", "Early Bird")
- Descriptions
- Prices (stored in cents for accuracy)
- Quantities available
- Status (available, sold out, hidden)

#### Ticket Operations
- Create unlimited ticket types per event
- Track sold vs. available tickets
- Sell tickets (increment sold count)
- Auto-mark as "sold out" when quantity reached
- Delete ticket types
- Real-time availability updates

---

## 📊 Database Schema

### Events Table
```typescript
{
  name: string;
  description: string;
  date: string; // ISO date string
  location: string;
  imageUrl?: string;
  status: "draft" | "published" | "cancelled";
  createdAt: number; // timestamp
}
```

### Tickets Table
```typescript
{
  eventId: Id<"events">; // Reference to parent event
  name: string;
  description: string;
  price: number; // in cents
  quantity: number; // total available
  sold: number; // number sold
  status: "available" | "sold_out" | "hidden";
}
```

---

## 🎨 UI Components

### EventList
Main component showing all events with:
- Grid layout for event cards
- Loading states
- Empty state with friendly message
- Create event button

### EventCard
Individual event display with:
- Event image (if provided)
- Event details (name, date, location)
- Status badge (color-coded)
- Ticket sales summary
- Action buttons (manage tickets, publish, cancel, delete)

### CreateEventForm
Modal form for creating new events:
- Event details input
- Date/time picker
- Image URL field
- Validation

### TicketManager
Ticket management interface:
- List all ticket types for an event
- Create new ticket types
- Sell tickets
- Delete ticket types
- Real-time availability tracking
- Sold out detection

---

## 🚀 Usage Examples

### Creating an Event

1. Click "Create New Event" button
2. Fill in:
   - Event Name: "Summer Music Festival 2024"
   - Description: "Annual outdoor music festival"
   - Date: Select date and time
   - Location: "Central Park, New York"
   - Image URL: (optional)
3. Click "Create Event"
4. Event appears in draft status

### Adding Tickets

1. Click "Manage Tickets" on an event
2. Click "+ Add Ticket Type"
3. Fill in:
   - Name: "General Admission"
   - Description: "Standard entry ticket"
   - Price: 50.00
   - Quantity: 1000
4. Click "Create Ticket Type"
5. Repeat for other ticket types (VIP, Early Bird, etc.)

### Publishing an Event

1. Ensure event has at least one ticket type
2. Click "Publish" button on event card
3. Event status changes to "published"
4. Event is now live!

### Selling Tickets

1. Click "Sell" on a ticket type
2. Enter quantity to sell
3. Sold count updates automatically
4. Status changes to "sold out" when fully sold

---

## 🔮 Potential Extensions

### Future Features to Add:

#### User Authentication
- Event organizers/admins
- User-specific event management
- Permission-based access

#### Advanced Ticketing
- Discount codes
- Early bird pricing with date ranges
- Group discounts
- Ticket bundles

#### Customer Features
- Public event listing page
- Ticket purchase flow
- Order history
- Email confirmations

#### Analytics
- Sales reports
- Revenue tracking
- Popular events
- Ticket type performance

#### Event Features
- Recurring events
- Event categories/tags
- Search and filtering
- Event capacity limits
- Waitlists

#### Payment Integration
- Stripe integration
- Multiple payment methods
- Refund handling
- Payment history

#### Notifications
- Email notifications
- SMS reminders
- Event updates to attendees
- Low stock alerts

---

## 📝 API Reference

### Events API (`convex/events.ts`)

| Function | Type | Description |
|----------|------|-------------|
| `list` | Query | Get all events |
| `listPublished` | Query | Get published events only |
| `get` | Query | Get single event by ID |
| `create` | Mutation | Create new event |
| `update` | Mutation | Update event details |
| `publish` | Mutation | Publish an event |
| `remove` | Mutation | Delete event and all tickets |

### Tickets API (`convex/tickets.ts`)

| Function | Type | Description |
|----------|------|-------------|
| `listByEvent` | Query | Get all tickets for an event |
| `get` | Query | Get single ticket by ID |
| `create` | Mutation | Create new ticket type |
| `update` | Mutation | Update ticket details |
| `sell` | Mutation | Record ticket sale |
| `remove` | Mutation | Delete ticket type |

---

## 🎯 Current Status

✅ **Implemented:**
- Event CRUD operations
- Ticket CRUD operations
- Event status management
- Ticket sales tracking
- Real-time updates
- Responsive UI
- Type-safe API

🚧 **Not Yet Implemented:**
- User authentication
- Public event pages
- Payment processing
- Email notifications
- Search/filtering
- Analytics dashboard

---

## 🔧 Development

### Running Locally

**Terminal 1 - Convex Backend:**
```bash
npm run convex:dev
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
```

Visit: http://localhost:3000

### Deploying to Production

**Backend:**
```bash
npm run convex:deploy
```

**Frontend:**
Push to GitHub → Vercel auto-deploys

---

## 💡 Tips

1. **Start with Draft Events** - Create and configure events before publishing
2. **Add Tickets Before Publishing** - Ensure all ticket types are set up
3. **Monitor Sales** - Track ticket sales in real-time
4. **Use Descriptive Names** - Make ticket types clear (e.g., "VIP - Front Row Access")
5. **Set Realistic Quantities** - Adjust based on venue capacity

---

## 🎉 Summary

MyTicket is now a fully functional event and ticket management system with:
- Event creation and lifecycle management
- Multiple ticket types per event
- Real-time ticket sales tracking
- Beautiful, modern UI
- Type-safe backend with Convex
- Ready for extension with authentication, payments, and more!

