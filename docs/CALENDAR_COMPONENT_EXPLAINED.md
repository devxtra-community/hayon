# 📅 CalendarComponent.tsx — Full Code Explanation

> **File:** `frontend/src/components/calendar/CalendarComponent.tsx`  
> **Purpose:** Renders an interactive monthly calendar that lets users browse months, select a specific day, and view all posts (published and scheduled) that belong to that day.

---

## Table of Contents

1. [Top-Level Directive](#1-top-level-directive)
2. [Imports](#2-imports)
   - [React Hooks](#21-react-hooks)
   - [date-fns Utilities](#22-date-fns-utilities)
   - [Lucide Icons](#23-lucide-icons)
   - [Internal Utilities & Components](#24-internal-utilities--components)
3. [State Variables](#3-state-variables)
4. [Computed / Derived Variables](#4-computed--derived-variables)
5. [Navigation Functions](#5-navigation-functions)
6. [useEffect Hook](#6-useeffect-hook)
7. [fetchData Function (Data Logic)](#7-fetchdata-function-data-logic)
8. [JSX / Rendered UI Breakdown](#8-jsx--rendered-ui-breakdown)
   - [Calendar Header](#81-calendar-header)
   - [Calendar Grid — Day-name Row](#82-calendar-grid--day-name-row)
   - [Calendar Grid — Day Cells](#83-calendar-grid--day-cells)
   - [Content Indicator Dots](#84-content-indicator-dots)
   - [Posts Section — Header](#85-posts-section--header)
   - [Posts Section — Loading / Empty / List](#86-posts-section--loading--empty--list)
   - [Scheduled Posts Sub-Section](#87-scheduled-posts-sub-section)
9. [Data Flow — End-to-End Summary](#9-data-flow--end-to-end-summary)
10. [Key Design Decisions](#10-key-design-decisions)

---

## 1. Top-Level Directive

```tsx
"use client";
```

**What it is:** A Next.js App Router directive.  
**Why it's needed:** React hooks (`useState`, `useEffect`) and browser APIs only work inside _Client Components_. Without this line, Next.js would try to render the component on the server and throw errors because server components cannot hold local state or run side effects.

---

## 2. Imports

### 2.1 React Hooks

```tsx
import { useState, useEffect } from "react";
```

| Hook        | Purpose                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `useState`  | Creates reactive local state. When state changes, React re-renders the component automatically.            |
| `useEffect` | Runs side effects (like API calls) after the component renders, or whenever specified dependencies change. |

---

### 2.2 date-fns Utilities

```tsx
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
```

`date-fns` is a lightweight JavaScript date manipulation library. Every function imported here is a _pure function_ — it takes a date and returns a value without mutating anything.

| Function                                 | What it does                                                                                                                                                             | Where it's used                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `format(date, pattern)`                  | Formats a `Date` object into a readable string. Pattern `"MMMM yyyy"` → `"February 2026"`. Pattern `"MMMM do, yyyy"` → `"February 20th, 2026"`. Pattern `"dd"` → `"20"`. | Calendar header, day cells, posts section header                                 |
| `startOfMonth(date)`                     | Returns the first day (midnight) of the month for a given date.                                                                                                          | Used to anchor the month's grid start                                            |
| `endOfMonth(date)`                       | Returns the last moment of the last day of the month.                                                                                                                    | Used to anchor the month's grid end                                              |
| `startOfWeek(date, { weekStartsOn: 1 })` | Returns the Monday of the week that contains the given date. `weekStartsOn: 1` means Monday = first day.                                                                 | Finds where the calendar grid should start (may be days from the previous month) |
| `endOfWeek(date, { weekStartsOn: 1 })`   | Returns the Sunday of the week that contains the given date.                                                                                                             | Finds where the calendar grid should end (may include days from the next month)  |
| `eachDayOfInterval({ start, end })`      | Returns an **array of every Date** from `start` to `end` (inclusive).                                                                                                    | Generates all 28–42 `Date` objects that fill the grid                            |
| `isSameMonth(date1, date2)`              | Returns `true` if both dates fall in the same calendar month.                                                                                                            | Dims/fades cells that belong to previous or next month                           |
| `isSameDay(date1, date2)`                | Returns `true` if both dates share the same year, month, and day.                                                                                                        | Detects selected day, today's date, and matches posts to a day                   |
| `addMonths(date, n)`                     | Returns a new date that is `n` months forward.                                                                                                                           | `nextMonth()` navigation                                                         |
| `subMonths(date, n)`                     | Returns a new date that is `n` months backward.                                                                                                                          | `prevMonth()` navigation                                                         |

---

### 2.3 Lucide Icons

```tsx
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
```

| Icon           | Where used                       | Visual meaning                   |
| -------------- | -------------------------------- | -------------------------------- |
| `ChevronLeft`  | "Previous month" button          | `<` arrow                        |
| `ChevronRight` | "Next month" button              | `>` arrow                        |
| `Clock`        | "Scheduled posts" section header | Indicates time-scheduled content |
| `FileText`     | Empty-state illustration         | Represents "no posts found"      |

---

### 2.4 Internal Utilities & Components

```tsx
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { HistoryCard } from "@/components/history/HistoryCard";
```

| Import        | What it is                                                                                   | Why it's used                                                             |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cn`          | A helper that merges Tailwind class strings conditionally (wraps `clsx` + `tailwind-merge`). | Cleanly combines static and dynamic class names without string conflicts  |
| `api`         | A pre-configured `axios` instance with the backend base URL and auth headers already set.    | Makes authenticated HTTP requests to the backend without repeating config |
| `HistoryCard` | A reusable card UI component from the history feature.                                       | Renders each post (image, text, status, platform icons) in a card layout  |

---

## 3. State Variables

All declared inside the component function body using `useState`:

```tsx
const [currentDate, setCurrentDate] = useState(new Date());
const [selectedDate, setSelectedDate] = useState(new Date());
const [posts, setPosts] = useState<any[]>([]);
const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
const [allPosts, setAllPosts] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
```

| Variable         | Type      | Initial Value | Purpose                                                                                                                                                                                           |
| ---------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `currentDate`    | `Date`    | Today         | Controls **which month** is displayed on the calendar grid. When the user clicks "next" or "prev", this changes and the grid re-renders.                                                          |
| `selectedDate`   | `Date`    | Today         | Controls **which day is highlighted** (the active/selected cell). Also used to filter which posts appear in the "Posts for..." section below the grid.                                            |
| `posts`          | `any[]`   | `[]`          | Holds the **non-scheduled posts** that were created on the `selectedDate`. These appear in the main "Posts for this day" section.                                                                 |
| `scheduledPosts` | `any[]`   | `[]`          | Holds the **scheduled posts** whose `scheduledAt` date matches `selectedDate`. These appear in the "Scheduled for this day" sub-section.                                                          |
| `allPosts`       | `any[]`   | `[]`          | Holds **every post** returned by the API (up to 200). This is used purely to calculate the small indicator dots on each calendar cell — it must cover the whole month, not just the selected day. |
| `loading`        | `boolean` | `false`       | Controls the **spinner visibility**. Set to `true` before the API call and `false` after it finishes (success or error).                                                                          |

> **Why separate `posts`, `scheduledPosts`, and `allPosts`?**
>
> - `allPosts` is needed for dot indicators across the whole visible grid.
> - `posts` and `scheduledPosts` are filtered subsets used in two separate UI sections below the grid.
> - Keeping them separate avoids repeated filtering on every render.

---

## 4. Computed / Derived Variables

These are **not state** — they are plain constants recalculated every render based on `currentDate`. Since `currentDate` is state, any change to it automatically causes a re-render and these values update instantly.

```tsx
const monthStart = startOfMonth(currentDate);
const monthEnd = endOfMonth(monthStart);
const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

const calendarDays = eachDayOfInterval({
  start: calendarStart,
  end: calendarEnd,
});
```

### Step-by-step for February 2026:

| Variable        | Example Value              | Explanation                                                                               |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `monthStart`    | `Feb 1, 2026`              | First day of the current month                                                            |
| `monthEnd`      | `Feb 28, 2026`             | Last day of the current month                                                             |
| `calendarStart` | `Jan 26, 2026` (Monday)    | The Monday of the week containing Feb 1. Feb 1 is a Sunday, so the grid starts on Jan 26. |
| `calendarEnd`   | `Mar 1, 2026` (Sunday)     | The Sunday of the week containing Feb 28.                                                 |
| `calendarDays`  | Array of 35 `Date` objects | Every day from Jan 26 → Mar 1 (35 cells = 5 weeks × 7 days).                              |

This approach ensures the grid always shows complete weeks — even if the month doesn't start on Monday.

---

## 5. Navigation Functions

```tsx
const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
const setToday = () => {
  const today = new Date();
  setCurrentDate(today);
  setSelectedDate(today);
};
```

| Function    | What it does                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nextMonth` | Advances `currentDate` by 1 month → triggers re-render → grid shows next month                                                                                          |
| `prevMonth` | Moves `currentDate` back 1 month → grid shows previous month                                                                                                            |
| `setToday`  | Resets **both** `currentDate` and `selectedDate` to right now. This way, the grid jumps back to the current month **and** today's cell becomes selected simultaneously. |

> **Why does `setToday` update two state values?**  
> If only `currentDate` changed, you'd be viewing today's month but the selected day might still be on a different date. Resetting both gives a clean "home" state.

---

## 6. useEffect Hook

```tsx
useEffect(() => {
  fetchData();
}, [selectedDate, currentDate]);
```

**What it does:** Runs `fetchData()` automatically whenever `selectedDate` **or** `currentDate` changes.

**Why both dependencies?**

- `selectedDate` changes when the user clicks a different day → need fresh posts for that day.
- `currentDate` changes when the user navigates months → need fresh `allPosts` to draw the dots for the new month.

> Without the dependency array `[]`, this would run on **every single render**, causing infinite loops. With the array, React only re-runs if one of those two values actually changed.

---

## 7. fetchData Function (Data Logic)

```tsx
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get("/posts", { params: { limit: 200 } });
    const fetchedPosts = response.data.data.posts;
    setAllPosts(fetchedPosts);

    const dayPosts = fetchedPosts.filter((post: any) => {
      const postDate =
        post.status === "SCHEDULED" && post.scheduledAt
          ? new Date(post.scheduledAt)
          : new Date(post.createdAt);
      return isSameDay(postDate, selectedDate);
    });

    setPosts(dayPosts.filter((p: any) => p.status !== "SCHEDULED"));
    setScheduledPosts(dayPosts.filter((p: any) => p.status === "SCHEDULED"));
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
  } finally {
    setLoading(false);
  }
};
```

### Line-by-line breakdown:

| Line                                                                                                      | What it does                                            | Why                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setLoading(true)`                                                                                        | Shows the spinner immediately                           | Gives user visual feedback that data is loading                                                                                                                |
| `api.get("/posts", { params: { limit: 200 } })`                                                           | Calls `GET /posts?limit=200` on the backend             | Fetches up to 200 posts in one call so we have enough data to populate the entire grid                                                                         |
| `response.data.data.posts`                                                                                | Drills into the API response structure                  | The backend wraps the array inside `{ data: { posts: [...] } }`                                                                                                |
| `setAllPosts(fetchedPosts)`                                                                               | Stores **all posts** in state                           | Used later by the indicator dots on every calendar cell                                                                                                        |
| **Filtering `dayPosts`**                                                                                  | Picks only posts relevant to `selectedDate`             | The calendar only shows one day's posts in the list below                                                                                                      |
| `post.status === "SCHEDULED" && post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt)` | Chooses the correct date field per post                 | Scheduled posts use `scheduledAt` (future date), published posts use `createdAt` (past date). Using the wrong field would put posts on the wrong calendar day. |
| `isSameDay(postDate, selectedDate)`                                                                       | Returns only posts whose date matches the selected cell | Core filter — only show posts for the day the user clicked                                                                                                     |
| `setPosts(dayPosts.filter(p.status !== "SCHEDULED"))`                                                     | Separates non-scheduled posts                           | These go into the top "Posts for this day" section                                                                                                             |
| `setScheduledPosts(dayPosts.filter(p.status === "SCHEDULED"))`                                            | Separates scheduled posts                               | These go into the "Scheduled for this day" sub-section                                                                                                         |
| `catch (error)`                                                                                           | Catches network or API errors                           | Prevents the UI from crashing; logs error to console                                                                                                           |
| `finally { setLoading(false) }`                                                                           | Always hides the spinner                                | Runs whether the API succeeded or failed — prevents a forever-spinning loader                                                                                  |

---

## 8. JSX / Rendered UI Breakdown

### 8.1 Calendar Header

```tsx
<h2>{format(currentDate, "MMMM yyyy")}</h2>
<button onClick={prevMonth}><ChevronLeft /></button>
<button onClick={nextMonth}><ChevronRight /></button>
<button onClick={setToday}>Today</button>
```

- Displays the month and year (e.g., `"February 2026"`) derived from `currentDate`.
- The `<` and `>` chevron buttons call `prevMonth` / `nextMonth`.
- The "Today" button resets the view to the current day via `setToday`.

---

### 8.2 Calendar Grid — Day-name Row

```tsx
{
  ["Mon", "Tue", "Wen", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>);
}
```

A hardcoded array of 7 day-name labels rendered as column headers. They match the week starting on Monday (consistent with `weekStartsOn: 1` in the date calculations).

> **Note:** `"Wen"` is a typo — it should be `"Wed"`. This is a cosmetic bug but doesn't affect functionality.

---

### 8.3 Calendar Grid — Day Cells

```tsx
{
  calendarDays.map((day, idx) => {
    const isSelected = isSameDay(day, selectedDate);
    const isCurrentMonth = isSameMonth(day, monthStart);
    const isToday = isSameDay(day, new Date());

    return (
      <button
        key={idx}
        onClick={() => setSelectedDate(day)}
        className={cn(
          "aspect-[4/3] rounded-[16px] ...",
          isCurrentMonth ? "bg-white" : "bg-white/40 opacity-40",
          isSelected
            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
            : "hover:bg-white/80 hover:shadow-sm",
          !isSelected && isToday && "ring-2 ring-primary/20 ring-offset-2",
        )}
      >
        <span>{format(day, "dd")}</span>
        {/* dots */}
      </button>
    );
  });
}
```

For each `Date` in `calendarDays`, three boolean flags are computed:

| Variable         | Type      | Purpose                                                                               |
| ---------------- | --------- | ------------------------------------------------------------------------------------- |
| `isSelected`     | `boolean` | Is this day the user's currently selected date? → Applies primary color highlight     |
| `isCurrentMonth` | `boolean` | Does this day belong to the currently viewed month? → Dims cells from prev/next month |
| `isToday`        | `boolean` | Is this day today's actual date? → Adds a subtle ring/outline when not selected       |

**`cn()` conditional classes:**

- **Base:** `aspect-[4/3] rounded-[16px]` — card shape, same aspect ratio for every cell.
- **Month check:** Full opacity for current-month days, 40% opacity + white-tinted background for overflow days.
- **Selected:** Green primary background, white text, slight scale-up (`scale-[1.02]`) for a pressed/active feel.
- **Unselected hover:** Slight white overlay and shadow appear on mouse hover.
- **Today (unselected):** Green ring outlines today without overriding the selection style.

---

### 8.4 Content Indicator Dots

```tsx
{
  allPosts.some((p) => p.status === "SCHEDULED" && isSameDay(new Date(p.scheduledAt), day)) && (
    <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
  );
}

{
  allPosts.some((p) => p.status !== "SCHEDULED" && isSameDay(new Date(p.createdAt), day)) && (
    <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white/60" : "bg-gray-300")} />
  );
}
```

These are tiny dot badges rendered inside each day cell to give the user a quick visual scan of content activity.

| Dot                                  | Color (normal) | Color (selected cell)  | Meaning                                                      |
| ------------------------------------ | -------------- | ---------------------- | ------------------------------------------------------------ |
| First dot (solid green `bg-primary`) | Primary green  | White                  | This day has at least one **scheduled** post                 |
| Second dot (gray `bg-gray-300`)      | Gray           | Semi-transparent white | This day has at least one **published or other status** post |

`allPosts.some(...)` is used (not `posts`) because `posts` only holds data for the selected day. `allPosts` covers every fetched post, allowing dots on all visible cells.

---

### 8.5 Posts Section — Header

```tsx
<h3>Posts for {format(selectedDate, "MMMM do, yyyy")}</h3>
<span>{posts.length} {posts.length === 1 ? "Post" : "Posts"}</span>
```

- `format(selectedDate, "MMMM do, yyyy")` → e.g., `"February 20th, 2026"`. The `do` token adds the ordinal suffix (`st`, `nd`, `rd`, `th`).
- The count badge uses a ternary to correctly pluralize: `"1 Post"` vs `"3 Posts"`.

---

### 8.6 Posts Section — Loading / Empty / List

```tsx
{
  loading ? (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  ) : posts.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <HistoryCard
          key={post._id}
          id={post._id}
          imageUrl={post.content?.mediaItems?.[0]?.s3Url}
          description={post.content?.text || "No content"}
          status={post.status}
          platformStatuses={post.platformStatuses?.map((p: any) => ({
            platform: p.platform,
            status: p.status,
            platformPostUrl: p.platformPostUrl,
          }))}
          mediaCount={post.media?.length}
          createdAt={post.createdAt}
        />
      ))}
    </div>
  ) : (
    <div>
      <FileText size={40} />
      <p>No posts found for this day</p>
    </div>
  );
}
```

**Three rendering states:**

| Condition          | What renders                                | Why                                  |
| ------------------ | ------------------------------------------- | ------------------------------------ |
| `loading === true` | Spinning circle                             | API call is in progress              |
| `posts.length > 0` | Responsive grid of `HistoryCard` components | There are published posts to display |
| else               | Empty state with icon and message           | No posts exist for this day          |

**`HistoryCard` props explained:**

| Prop               | Value Source                              | Purpose                                                                                 |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `key={post._id}`   | MongoDB document ID                       | React requires a unique key on list items for efficient re-renders                      |
| `id={post._id}`    | MongoDB document ID                       | Used inside the card for actions like "view report"                                     |
| `imageUrl`         | `post.content?.mediaItems?.[0]?.s3Url`    | First image URL from S3. Optional chaining (`?.`) prevents crashes when no media exists |
| `description`      | `post.content?.text \|\| "No content"`    | Post caption. Falls back to `"No content"` if empty                                     |
| `status`           | `post.status`                             | Used to color-code the card and show retry option for failed posts                      |
| `platformStatuses` | Mapped array from `post.platformStatuses` | Shows per-platform icons with status indicators (✓ / ✗ / spinner)                       |
| `mediaCount`       | `post.media?.length`                      | Shows `+N` badge if there are multiple media items                                      |
| `createdAt`        | `post.createdAt`                          | Displayed as a formatted date below the card                                            |

---

### 8.7 Scheduled Posts Sub-Section

```tsx
{scheduledPosts.length > 0 && (
  <div className="mt-12 pt-12 border-t border-gray-100">
    <h3><Clock /> Scheduled for this day</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scheduledPosts.map((post) => (
        <HistoryCard
          key={post._id}
          id={post._id}
          imageUrl={post.content?.mediaItems?.[0]?.s3Url}
          description={post.content?.text || "No content"}
          status={post.status}
          platformStatuses={post.platformStatuses?.map(...)}
          mediaCount={post.content?.mediaItems?.length}
          createdAt={post.scheduledAt || post.createdAt}
        />
      ))}
    </div>
  </div>
)}
```

This section is **conditionally rendered** — it only appears if `scheduledPosts.length > 0`. The key difference from the posts section above:

| Difference        | Published Posts      | Scheduled Posts                                                     |
| ----------------- | -------------------- | ------------------------------------------------------------------- |
| State source      | `posts`              | `scheduledPosts`                                                    |
| `mediaCount` prop | `post.media?.length` | `post.content?.mediaItems?.length`                                  |
| `createdAt` prop  | `post.createdAt`     | `post.scheduledAt \|\| post.createdAt` (prefers the scheduled time) |

Using `post.scheduledAt` for the date display makes sense here — users want to see _when_ the post is scheduled, not when the draft was created.

---

## 9. Data Flow — End-to-End Summary

```
User opens Calendar page
        ↓
CalendarComponent mounts with currentDate = today, selectedDate = today
        ↓
useEffect fires → fetchData() called
        ↓
GET /posts?limit=200 → backend returns up to 200 posts
        ↓
setAllPosts([...all 200 posts])         ← populates dot indicators on cells
        ↓
Filter by selectedDate:
  dayPosts = posts matching today
        ↓
setPosts([non-scheduled dayPosts])      ← "Posts for this day" section
setScheduledPosts([scheduled dayPosts]) ← "Scheduled for this day" section
        ↓
User clicks a different day
        ↓
setSelectedDate(day) → selectedDate changes → useEffect fires again → fetchData()
        ↓
New dayPosts calculated, posts/scheduledPosts updated → UI re-renders
        ↓
User clicks "next month"
        ↓
setCurrentDate(nextMonth) → calendarDays recalculated → grid re-renders
useEffect fires → fetchData() again (allPosts refreshed for new month)
```

---

## 10. Key Design Decisions

| Decision                                                | Reason                                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `limit: 200` on the API call                            | Loads enough posts to cover the entire visible calendar without multiple API calls per cell          |
| `allPosts` separate from `posts`                        | Dot indicators need data across the whole month; the post list needs data only for the selected day  |
| Two separate date fields (`scheduledAt` vs `createdAt`) | Scheduled posts must appear on their _future_ date, not their creation date                          |
| `isSameDay` for comparison                              | Avoids timezone/time-of-day comparison bugs that occur with `===` on Date objects                    |
| `weekStartsOn: 1` everywhere                            | Ensures Monday-first weeks are consistent between grid headers and the computed `calendarDays` array |
| `finally { setLoading(false) }`                         | Guarantees the spinner always stops, even if the API throws an error                                 |
| Optional chaining (`?.`) throughout                     | Prevents white-screen crashes when post data is missing nested fields                                |
