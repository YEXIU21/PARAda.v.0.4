# 🔁 Interactive Task Loop with User Feedback

This tool enables an AI-driven workflow where tasks are performed interactively in response to user input. After each task, the user is prompted for the next instruction. The loop continues until the user stops it manually or the maximum number of tool calls is reached.

---

## 🧠 How It Works

1. The AI performs its assigned task.
2. Upon completion, it runs a simple Python script to prompt the user for feedback or a new instruction.
3. Based on the user's input, the AI continues working.
4. The loop stops when:
   - The user enters "stop" when prompted, or
   - The tool call limit is reached.

---

## 📁 Files

### `infinity.py` (placed in the project root)
A simple Python script that prompts the user for input. The file contains:
```python
infinity_input = input(":")
```

### `rules.md` (configuration for the interactive workflow)
Contains the workflow instructions and rules for the AI assistant to follow when using this interactive loop system.

---

## 🚀 Getting Started

1. Ensure Python is installed on your system.
2. Run the interactive loop with:
   ```bash
   python infinity.py
   ```
3. Type your instructions at the prompt and press Enter.
4. Type "stop" to exit the loop when you're done.

---

## 📝 Note
This project follows separation of concerns and clean code principles.


