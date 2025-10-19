# Centaurus Drum Machine

A modern web-based drum machine with hardware controller support, built with React, TypeScript, and the Web MIDI API.

## Features

- 🥁 **Interactive Drum Sequencer**: Create beats with an intuitive step sequencer interface
- 🎛️ **Hardware Controller Support**: Connect MIDI controllers for hands-on beat creation
- 💡 **Intelligent WLED LED Routing**: Automatic visualization routing to LED hardware (Epic 18)
- 🔧 **Browser Compatibility**: Works across modern browsers with graceful degradation
- 🎵 **High-Quality Audio**: Powered by Tone.js for professional audio processing
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- ♿ **Accessibility**: Built with accessibility best practices

### 💡 Epic 18: Intelligent WLED Visualization Routing

**Configure hardware once, visualize any module automatically**

The WLED routing system automatically routes module visualizations to physical LED devices based on device capabilities and module requirements. No manual device selection needed!

**Key Features:**
- **Automatic Routing**: Modules automatically find and use compatible LED devices
- **Multi-Device Support**: Route different modules to different devices simultaneously
- **Overlay Effects**: Audio reactive and ambient effects layer on top of primary visualizations
- **Device Persistence**: WLED devices saved to Supabase, shared across jam sessions
- **Context-Aware Rules**: Guitar on 2D grid gets exclusive access, drum machine prefers grids, etc.
- **Real-Time Sync**: Device changes sync across all session participants in <200ms

**Supported Visualizations:**
- Step Sequencer (2D grid or 1D strip)
- Piano Roll (1D strip with 88-key mapping)
- Guitar Fretboard (2D grid)
- Audio Reactive Ripple (overlay on any device)

**Documentation:**
- [WLED Manager User Guide](docs/guides/wled-manager-user-guide.md)
- [Developer Guide](docs/guides/wled-routing-system.md)
- [Architecture](docs/architecture/wled-visualization-routing.md)
- [Test Scenarios](docs/testing/epic-18-test-scenarios.md)

## Hardware Controller Requirements

### Supported Browsers

| Browser | MIDI Support | Notes |
|---------|-------------|-------|
| **Chrome** | ✅ Full | Recommended - Complete Web MIDI API support |
| **Edge** | ✅ Full | Complete Web MIDI API support |
| **Firefox** | ⚠️ Basic | Limited SysEx support, basic MIDI functionality |
| **Safari** | ❌ None | Web MIDI API not supported |

### HTTPS Requirement

**⚠️ Important**: Hardware controllers require **HTTPS** or **localhost** to function due to Web MIDI API security requirements.

- ✅ **Production**: Must use HTTPS (e.g., `https://yourdomain.com`)
- ✅ **Development**: `localhost` is considered secure (e.g., `http://localhost:3000`)
- ❌ **HTTP**: Regular HTTP connections will not work with MIDI devices

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser (Chrome/Edge recommended for full features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/centaurus-drum-machine.git
cd centaurus-drum-machine

# Install dependencies
npm install

# Configure environment (for Supabase features)
cp .env.example .env.development
# Edit .env.development with your Supabase credentials
# See docs/ENVIRONMENT_SETUP.md for detailed instructions

# Start development server
npm run dev
```

The development server will start on `http://localhost:5173` (HTTPS not required for localhost).

**📚 For environment setup and deployment:** See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)

### HTTPS Development Setup

If you need to test HTTPS-specific functionality or connect from other devices:

#### Option 1: Local HTTPS with Vite

```bash
# Install local certificates (one-time setup)
npm install -D @vitejs/plugin-basic-ssl

# Update vite.config.ts to include HTTPS
# See "HTTPS Configuration" section below
```

#### Option 2: Using mkcert (Recommended)

```bash
# Install mkcert
# macOS
brew install mkcert
brew install nss # if you use Firefox

# Windows (using Chocolatey)
choco install mkcert

# Linux
# See: https://github.com/FiloSottile/mkcert#installation

# Create local CA and certificates
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Update Vite configuration to use certificates
```

#### Option 3: Using ngrok (For external testing)

```bash
# Install ngrok globally
npm install -g ngrok

# Start your development server
npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 5173
```

### HTTPS Configuration

Add HTTPS support to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('localhost-key.pem'),
      cert: fs.readFileSync('localhost.pem'),
    },
    port: 5173,
    host: '0.0.0.0', // Allow external connections
  }
})
```

## Hardware Controller Setup

### Connecting Your MIDI Device

1. **Connect your MIDI controller** via USB or MIDI cable
2. **Open the application** in a supported browser
3. **Check the hardware status indicator** in the top-right corner
4. **If connection fails**, see troubleshooting section below

### Supported Controllers

The application uses a generic MIDI interface that works with most controllers:

- **Akai APC40/APC40 MkII** - Optimized support with LED feedback
- **Novation Launchpad series** - Grid controllers
- **Arturia BeatStep** - Step sequencers
- **Most MIDI keyboards** - Basic note input
- **Generic MIDI controllers** - CC and note input

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

## Troubleshooting

### MIDI Connection Issues

#### "Hardware Not Supported" Message

**Cause**: Your browser doesn't support Web MIDI API

**Solutions**:
- Switch to Chrome or Edge for full hardware support
- Firefox has basic MIDI support with limitations
- Safari users can still use all software features

#### "HTTPS Required" Message

**Cause**: Web MIDI API requires a secure context

**Solutions**:
1. **Development**: Use `localhost` (already secure)
2. **Production**: Deploy to HTTPS site
3. **Local Network**: Use mkcert or ngrok (see HTTPS setup above)

#### "No MIDI Devices Available" Message

**Troubleshooting Steps**:
1. **Check physical connection**: Ensure device is connected via USB
2. **Verify device power**: Some controllers need external power
3. **Test device recognition**:
   - Windows: Check Device Manager
   - macOS: Check Audio MIDI Setup
   - Linux: Check `lsusb` output
4. **Try different USB port**: Some ports may have power/data limitations
5. **Restart browser**: Refresh MIDI device list
6. **Check device compatibility**: Ensure device supports USB MIDI

#### Connection Drops Unexpectedly

**Common Causes**:
- USB cable connection issues
- Device power management settings
- Browser background tab limitations

**Solutions**:
1. Use a high-quality USB cable
2. Disable USB power saving in system settings
3. Keep browser tab active and visible

### Browser-Specific Issues

#### Chrome/Edge
- Usually no issues
- Full Web MIDI API support
- Best performance and compatibility

#### Firefox
- Limited SysEx support
- Some advanced features may not work
- Basic MIDI input/output functional

#### Safari
- No Web MIDI API support
- Software-only mode available
- Consider using Chrome or Edge for hardware features

### Performance Issues

#### High CPU Usage
- Close unnecessary browser tabs
- Reduce audio quality if needed
- Check for background processes

#### Audio Latency
- Use ASIO drivers on Windows
- Reduce buffer sizes in audio settings
- Close other audio applications

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Audio Engine**: Tone.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **MIDI**: Native Web MIDI API
- **Backend**: Supabase (Realtime, Postgres, Auth)
- **Testing**: Vitest + React Testing Library

## Project Structure

```
src/
├── components/          # React components
│   ├── DrumMachine/    # Core sequencer components
│   ├── Layout/         # App layout components
│   └── ...
├── hardware/           # Hardware abstraction layer
│   ├── core/          # Core hardware management
│   ├── ui/            # Hardware UI components
│   └── utils/         # MIDI and connection utilities
├── types/             # TypeScript type definitions
├── utils/             # Audio and utility functions
└── App.tsx            # Main application component
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing TypeScript and React patterns
- Write tests for new features
- Update documentation for user-facing changes
- Ensure hardware features degrade gracefully
- Test across different browsers when possible

## Browser Support Matrix

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Basic Sequencer | ✅ | ✅ | ✅ | ✅ |
| Audio Playback | ✅ | ✅ | ✅ | ✅ |
| MIDI Input | ✅ | ✅ | ⚠️ | ❌ |
| MIDI Output | ✅ | ✅ | ⚠️ | ❌ |
| LED Control | ✅ | ✅ | ❌ | ❌ |
| SysEx Messages | ✅ | ✅ | ❌ | ❌ |

Legend: ✅ Supported | ⚠️ Limited | ❌ Not Supported

## Security Considerations

- Web MIDI API requires HTTPS or localhost for security
- MIDI SysEx access may be restricted in some browsers
- No sensitive data is transmitted via MIDI
- All MIDI communication is local between browser and hardware

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For hardware setup issues, browser compatibility questions, or general support:

1. Check this README's troubleshooting section
2. Review browser compatibility matrix
3. Ensure HTTPS requirements are met
4. Test with a supported browser (Chrome/Edge recommended)

## Acknowledgments

- **Tone.js** - Professional web audio framework
- **Web MIDI API** - Browser MIDI device integration
- **React** & **TypeScript** - Application framework and type safety
- **Tailwind CSS** - Utility-first styling approach