# SkillSwap - Community Skill Exchange

A modern web application for exchanging skills and knowledge within a community.

## Features

- 🔐 Email/Password Authentication
- 👤 User Profiles
- 🎯 Skills Management
- 🤝 Help Requests
- 💬 Connections
- 📊 Dashboard Analytics
- 🌓 Dark Mode Support

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skillswap.git
   cd skillswap
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**:
   
   Follow the instructions in `scripts/DATABASE_SETUP.md`:
   - Run `01_init_schema.sql`
   - Run `02_profile_trigger.sql`
   - Run `03_fix_existing_users.sql` (if needed)

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Database Setup

See detailed instructions in `scripts/DATABASE_SETUP.md`.

Quick steps:
1. Create a Supabase project
2. Run the SQL scripts in order
3. Configure authentication settings
4. Update environment variables

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

**Quick Deploy to Vercel:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## Project Structure

```
skill-swap-web-application/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── discover/          # Discover page
│   ├── help-requests/     # Help requests page
│   └── connections/       # Connections page
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── dashboard/        # Dashboard components
│   ├── navigation/       # Navigation components
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   └── supabase/        # Supabase client
├── scripts/             # Database scripts
│   ├── 01_init_schema.sql
│   ├── 02_profile_trigger.sql
│   └── 03_fix_existing_users.sql
└── public/              # Static assets
```

## Features Overview

### Authentication
- Email/password signup and login
- Password reset functionality
- Automatic profile creation
- Session management

### Dashboard
- View your stats (skills, connections, requests)
- Quick actions
- Profile overview

### Skills Management
- Add/remove skills
- Categorize skills (Technical/Non-Technical)
- Skill levels

### Help Requests
- Create help requests
- Browse community requests
- Track your requests

### Discover
- Find other users
- Browse skills
- Connect with people

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions:
- Check the `DEPLOYMENT.md` guide
- Review `scripts/DATABASE_SETUP.md`
- Open an issue on GitHub

## Acknowledgments

Built with modern web technologies and best practices for a seamless user experience.

---

Made with ❤️ for the learning community
