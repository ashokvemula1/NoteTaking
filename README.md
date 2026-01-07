# GPT Chat Notes & Highlights

A powerful Chrome extension for ChatGPT and Google Gemini that provides comprehensive note-taking, text highlighting, and chat management features.

## Features

### 📝 Note Taking
- **Per-Chat Notes**: Separate notes for each chat conversation
- **Auto-Save**: Notes are automatically saved as you type
- **Character & Word Count**: Real-time statistics for your notes
- **Large Dashboard**: Maximum popup size (800x600px) for comfortable note-taking

### 🎨 Text Highlighting
- **Multi-Color Highlights**: Choose from 5 different colors (yellow, green, blue, pink, purple)
- **Smart Selection**: Select any text in chat responses to highlight
- **Persistent Highlights**: Highlights are saved and restored when you revisit chats
- **Visual Indicators**: Colored backgrounds and underlines for easy identification

### 📌 Highlight Notes
- **Add Comments**: Click any highlight to add/edit notes about that specific text
- **Note Indicators**: Visual markers show which highlights have notes
- **Easy Access**: Click highlighted text to view or edit notes

### 🔍 Highlight Navigation
- **Floating Widget**: Navigate between all highlights in the current chat
- **Prev/Next Buttons**: Jump to previous or next highlighted text
- **Smooth Scrolling**: Automatically scroll to and flash the selected highlight
- **Counter Display**: Shows current position and total number of highlights

### 📊 Highlights Dashboard
- **Highlights Tab**: View all chats that contain highlights
- **Chat Summary**: See how many highlights each chat has
- **Detail View**: Click any chat to see all its highlights with colors and notes
- **Quick Navigation**: Easy back button to return to the chat list

### ⭐ Favorites Sidebar
- **Collapsible Sidebar**: Toggle favorites panel with a star button
- **Drag & Drop**: Rearrange favorites by dragging them
- **Quick Access**: Click any favorite to navigate directly to that chat
- **Easy Management**: Remove favorites with a simple click

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

## Usage

### Taking Notes
1. Open any ChatGPT or Google Gemini chat
2. Click the extension icon to open the dashboard
3. The "Notes" tab is active by default
4. Type your notes - they auto-save automatically

### Highlighting Text
1. On a ChatGPT/Gemini chat page, select any text in a response
2. A color picker popup will appear above your selection
3. Choose a color to apply the highlight
4. Click the 📝 button to add a note while highlighting

### Adding Notes to Highlights
1. Click any highlighted text
2. A dialog will appear showing the highlighted text
3. Type your note and click "Save Note"
4. The highlight will show a 📝 indicator

### Navigating Highlights
1. When highlights exist, a floating widget appears (bottom-right)
2. Click "← Prev" or "Next →" to jump between highlights
3. The current highlight will flash for easy identification

### Managing Favorites
1. Click the ☆ button in the dashboard header to favorite a chat
2. Click the star icon on the left to expand the favorites sidebar
3. Drag favorites to rearrange them
4. Click any favorite to open that chat
5. Hover and click × to remove from favorites

### Viewing All Highlights
1. Open the extension dashboard
2. Click the "Highlights" tab
3. See all chats with highlights listed
4. Click any chat to view its highlights
5. Click "← Back" to return to the list

## Color Meanings

You can organize highlights by color based on your preference:
- 🟡 **Yellow**: General highlights or important information
- 🟢 **Green**: Correct answers or verified information
- 🔵 **Blue**: Questions or areas needing research
- 🌸 **Pink**: Examples or use cases
- 🟣 **Purple**: Key concepts or definitions

## Keyboard Shortcuts

Currently, the extension uses mouse/click interactions. Keyboard shortcuts may be added in future versions.

## Storage

All data is stored locally in your browser using Chrome's storage API:
- Notes are stored per chat (identified by chat URL)
- Highlights are stored per chat with color, text, and optional notes
- Favorites list is stored globally
- No data is sent to external servers

## Compatibility

- ✅ ChatGPT (chatgpt.com, chat.openai.com)
- ✅ Google Gemini (gemini.google.com)

## Privacy

This extension:
- Does NOT collect any personal data
- Does NOT send data to external servers
- Stores everything locally in your browser
- Only runs on ChatGPT and Gemini pages

## Version History

### Version 3.0 (Current)
- Added text highlighting with 5 colors
- Added highlight notes feature
- Added prev/next navigation for highlights
- Expanded popup to 800x600px dashboard
- Added tabs (Notes and Highlights)
- Added favorites sidebar with drag-and-drop
- Enhanced UI with gradient headers and animations

### Version 2.0
- Basic per-chat notes functionality

## Support

If you encounter any issues or have feature requests, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
