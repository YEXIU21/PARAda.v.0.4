import tkinter as tk
from tkinter import ttk
import os
import re
import time
import sys

class InfinityApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Infinity Input")
        self.root.geometry("450x350")  # Original window size
        
        # Configure style
        self.style = ttk.Style()
        self.style.configure("TFrame", background="#f0f0f0")
        self.style.configure("TLabel", background="#f0f0f0", font=("Arial", 12))
        self.style.configure("TButton", font=("Arial", 12))
        
        # Create main frame
        self.main_frame = ttk.Frame(root, padding="20")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create prompt label
        self.prompt_label = ttk.Label(self.main_frame, text="Prompt:")
        self.prompt_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Create a frame to hold the text widget and scrollbar with border
        self.text_frame = ttk.Frame(self.main_frame, borderwidth=1, relief="solid")
        self.text_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Create text input field (multi-line) with increased height and undo support
        self.input_text = tk.Text(self.text_frame, width=40, height=10, font=("Arial", 12), wrap=tk.WORD, undo=True, maxundo=-1)
        self.input_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Create scrollbar with custom style
        self.scrollbar = tk.Scrollbar(self.text_frame, orient="vertical", command=self.input_text.yview, 
                                      width=16, borderwidth=1, relief="raised")
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Configure the text widget to use the scrollbar
        self.input_text.config(yscrollcommand=self.scrollbar.set)
        
        # Force the scrollbar to be visible
        def force_scrollbar_visible():
            self.scrollbar.set(0.0, 0.9)  # This makes the scrollbar visible
        
        # Call after a short delay to ensure it's visible
        self.root.after(100, force_scrollbar_visible)
        
        self.input_text.focus()
        
        # Create status label for image path feedback
        self.status_label = ttk.Label(self.main_frame, text="", foreground="green")
        self.status_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Create timer label
        self.timer_label = ttk.Label(self.main_frame, text="Auto-submit in: 5:30", foreground="blue")
        self.timer_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Create submit button
        self.submit_button = ttk.Button(self.main_frame, text="Submit", command=self.submit)
        self.submit_button.pack(anchor=tk.E)
        
        # Initialize undo and redo stacks
        self.edit_separator()
        
        # Bind keyboard shortcuts for undo and redo
        self.root.bind("<Control-z>", lambda event: self.undo_action())
        self.root.bind("<Control-y>", lambda event: self.redo_action())
        self.root.bind("<Control-Shift-Z>", lambda event: self.redo_action())  # Alternative shortcut
        
        # Bind Enter key to submit
        self.root.bind("<Return>", lambda event: self.submit())
        
        # Bind Shift+Enter to allow normal newlines
        self.root.bind("<Shift-Return>", lambda event: None)
        
        # Bind paste event to handle image paths
        self.input_text.bind("<<Paste>>", self.handle_paste)
        
        # Bind key press and other events to create separators in the undo stack
        self.input_text.bind("<Key>", self.on_key_press)
        self.input_text.bind("<ButtonRelease-1>", lambda event: self.edit_separator())
        
        # Variable to store the input
        self.infinity_input = None
        
        # Set auto-submit timer (5:30 minutes = 330 seconds)
        self.auto_submit_time = 333
        self.remaining_time = self.auto_submit_time
        self.update_timer()
        
        # Track the last keystroke time to group edits
        self.last_keystroke_time = 0
        
    def on_key_press(self, event):
        """Create edit separators based on time gap between keystrokes"""
        current_time = time.time()
        # If it's been more than 1 second since the last keystroke, add a separator
        if current_time - self.last_keystroke_time > 1.0:
            self.edit_separator()
        self.last_keystroke_time = current_time
        
    def edit_separator(self):
        """Add a separator in the undo stack"""
        self.input_text.edit_separator()
        
    def undo_action(self):
        """Perform undo operation"""
        try:
            self.input_text.edit_undo()
        except tk.TclError:
            # No more undo operations available
            self.status_label.config(text="Nothing to undo", foreground="red")
            self.root.after(1500, lambda: self.status_label.config(text="", foreground="green"))
    
    def redo_action(self):
        """Perform redo operation"""
        try:
            self.input_text.edit_redo()
        except tk.TclError:
            # No more redo operations available
            self.status_label.config(text="Nothing to redo", foreground="red")
            self.root.after(1500, lambda: self.status_label.config(text="", foreground="green"))
    
    def update_timer(self):
        # Update timer display
        minutes = self.remaining_time // 60
        seconds = self.remaining_time % 60
        self.timer_label.config(text=f"Auto-submit in: {minutes}:{seconds:02d}")
        
        # Decrement timer
        self.remaining_time -= 1
        
        # Check if timer has expired
        if self.remaining_time < 0:
            # Set the text to "run infinity.py" and submit
            self.input_text.delete("1.0", tk.END)
            self.input_text.insert("1.0", "run infinity.py")
            self.submit()
        else:
            # Schedule the next timer update
            self.root.after(1000, self.update_timer)
    
    def handle_paste(self, event):
        # Let the default paste behavior handle everything
        # This completely bypasses any clipboard issues
        self.root.after(100, self.edit_separator)  # Add separator after paste
        return None
    
    def submit(self):
        # Get the input value from the text widget
        self.infinity_input = self.input_text.get("1.0", "end-1c")  # Get all text without the final newline
        self.root.destroy()

def get_input():
    # Create and run the GUI
    root = tk.Tk()
    app = InfinityApp(root)
    root.mainloop()
    
    # Return the input value after GUI closes
    return app.infinity_input

# Get input from GUI
infinity_input = get_input()

# Now infinity_input contains the text entered in the GUI
# Use print with flush=True to ensure complete output
print("Prompt:", flush=True)

# Print the input line by line to avoid terminal buffer issues
if infinity_input:
    lines = infinity_input.split('\n')
    for line in lines:
        print(line, flush=True)
else:
    print("(no input provided)", flush=True)