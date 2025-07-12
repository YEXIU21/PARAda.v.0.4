import tkinter as tk
from tkinter import ttk
import os
import re
import time
import sys
import io
import tempfile
import gc  # Garbage collection for managing memory

class InfinityApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Infinity Input")
        self.root.geometry("500x380")  # Increased window size for better visibility
        
        # Configure style
        self.style = ttk.Style()
        self.style.configure("TFrame", background="#f0f0f0")
        self.style.configure("TLabel", background="#f0f0f0", font=("Arial", 12))
        self.style.configure("TButton", font=("Arial", 12))
        self.style.configure("TCheckbutton", background="#f0f0f0", font=("Arial", 11))
        
        # Create main frame
        self.main_frame = ttk.Frame(root, padding="20")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create prompt label
        self.prompt_label = ttk.Label(self.main_frame, text="Prompt:")
        self.prompt_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Create a frame to hold the text widget and scrollbar with border
        self.text_frame = ttk.Frame(self.main_frame, borderwidth=1, relief="solid")
        self.text_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Create text input field with increased capacity for large content
        self.input_text = tk.Text(
            self.text_frame, 
            width=40, 
            height=10, 
            font=("Arial", 12), 
            wrap=tk.WORD, 
            undo=True, 
            maxundo=-1,
            blockcursor=False,  # Less memory intensive cursor
        )
        self.input_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Configure for better memory usage with large text
        self.input_text.configure(autoseparators=True)  # Automatic undo separators
        
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
        
        # Create a button frame to ensure the submit button is properly displayed
        self.button_frame = ttk.Frame(self.main_frame)
        self.button_frame.pack(fill=tk.X, pady=(0, 5))
        
        # Create infinity.py checkbox in the button frame (new checkbox)
        self.include_infinity = tk.BooleanVar(value=True)  # Set to True by default
        self.infinity_checkbox = ttk.Checkbutton(
            self.button_frame, 
            text="infinity.py", 
            variable=self.include_infinity
        )
        self.infinity_checkbox.pack(side=tk.LEFT, padx=(0, 5))
        
        # Create reminder checkbox in the button frame
        self.include_reminder = tk.BooleanVar(value=False)
        self.reminder_checkbox = ttk.Checkbutton(
            self.button_frame, 
            text="Include reminder limitless on submit", 
            variable=self.include_reminder
        )
        self.reminder_checkbox.pack(side=tk.LEFT, padx=(0, 5))
        
        # Create submit button in the button frame
        self.submit_button = ttk.Button(self.button_frame, text="Submit", command=self.submit)
        self.submit_button.pack(side=tk.RIGHT, padx=(0, 5))
        
        # Create timer label
        self.timer_label = ttk.Label(self.main_frame, text="Auto-submit in: 5:30", foreground="blue")
        self.timer_label.pack(anchor=tk.W, pady=(0, 5))
        
        # For handling extremely large text, use a temporary file for overflow
        self.temp_file = None
        self.using_temp_file = False
        self.text_overflow_threshold = 1000000  # Switch to temp file if text is larger than ~1MB
        
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
        
        # Try to pre-load the limitless file content
        self.limitless_content = self.limitless()
        
    def limitless(self):
        """Read the content from the limitless file"""
        limitless_path = "C:/Users/SHADOW/Videos/rls/limitless.txt"
        try:
            if os.path.exists(limitless_path):
                with open(limitless_path, 'r', encoding='utf-8') as file:
                    return file.read()
            else:
                return "run infinity.py"
        except Exception as e:
            print(f"Error reading limitless file: {e}")
            return "run infinity.py"
        
    def on_key_press(self, event):
        """Create edit separators based on time gap between keystrokes"""
        current_time = time.time()
        # If it's been more than 1 second since the last keystroke, add a separator
        if current_time - self.last_keystroke_time > 1.0:
            self.edit_separator()
        self.last_keystroke_time = current_time
        
        # Check text length - if it's getting very large, switch to temp file
        if not self.using_temp_file and len(self.input_text.get("1.0", tk.END)) > self.text_overflow_threshold:
            self.switch_to_temp_file()
        
    def switch_to_temp_file(self):
        """Switch to using a temporary file for very large text input"""
        try:
            # Create a temporary file
            self.temp_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, encoding='utf-8')
            
            # Write current content to the file
            current_text = self.input_text.get("1.0", tk.END)
            self.temp_file.write(current_text)
            self.temp_file.flush()
            
            # Set flag to indicate we're using temp file
            self.using_temp_file = True
            
            # Show status
            self.status_label.config(text="Using disk storage for large text", foreground="blue")
            self.root.after(3000, lambda: self.status_label.config(text="", foreground="green"))
            
            # Free up memory
            gc.collect()
            
        except Exception as e:
            print(f"Error switching to temp file: {e}")
            # Continue with in-memory operation
            self.using_temp_file = False
        
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
            # Set the text to the limitless content and auto-submit
            # For auto-submit, always include the limitless regardless of checkbox
            self.input_text.delete("1.0", tk.END)
            if self.limitless_content and self.limitless_content.strip():
                self.input_text.insert("1.0", self.limitless_content)
            else:
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
        if self.using_temp_file and self.temp_file:
            # Get content from temp file if we're using it
            try:
                self.temp_file.seek(0)
                current_text = self.temp_file.read()
                # Also get any recent changes from the text widget
                recent_text = self.input_text.get("1.0", "end-1c")
                # Combine them (the temp file might be outdated)
                if len(recent_text) < self.text_overflow_threshold:
                    current_text = recent_text
            except Exception as e:
                print(f"Error reading from temp file: {e}")
                # Fallback to text widget
                current_text = self.input_text.get("1.0", "end-1c")
        else:
            # Normal operation - get text from widget
            current_text = self.input_text.get("1.0", "end-1c")
        
        # Check if the infinity.py checkbox is checked
        if self.include_infinity.get():
            # If checkbox is checked, set the text to "run infinity.py"
            current_text = "run infinity.py"
        else:
            # Check if this is a manual submission (not an auto-submit)
            # and if the reminder checkbox is checked
            if not self.remaining_time < 0 and self.include_reminder.get() and current_text.strip():
                # If not empty and checkbox is checked, include the limitless
                if self.limitless_content and self.limitless_content.strip():
                    if not current_text.endswith('\n'):
                        current_text += '\n\n'
                    else:
                        current_text += '\n'
                    current_text += self.limitless_content
        
        self.infinity_input = current_text
        
        # Clean up temp file if we were using one
        self.cleanup_temp_file()
        
        self.root.destroy()
        
    def cleanup_temp_file(self):
        """Clean up temporary file if it exists"""
        if self.temp_file:
            try:
                self.temp_file.close()
                if os.path.exists(self.temp_file.name):
                    os.unlink(self.temp_file.name)
            except Exception as e:
                print(f"Error cleaning up temp file: {e}")
        
    def __del__(self):
        """Destructor to ensure temp file cleanup"""
        self.cleanup_temp_file()

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

# Enhanced unlimited output handling - no length restrictions
if infinity_input:
    # Ensure newlines are properly handled
    infinity_input = infinity_input.replace('\r\n', '\n').replace('\r', '\n')
    
    # Write very large content to a temporary file first to ensure nothing is lost
    if len(infinity_input) > 100000:  # For very large content
        temp_output_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, encoding='utf-8')
        try:
            # Save the complete content to file first
            temp_output_file.write(infinity_input)
            temp_output_file.flush()
            temp_output_file.close()
            
            # Read and output in small chunks
            with open(temp_output_file.name, 'r', encoding='utf-8') as f:
                while True:
                    chunk = f.read(256)  # Very small chunks
                    if not chunk:
                        break
                    sys.stdout.write(chunk)
                    sys.stdout.flush()
                    
                    # Small delay to prevent buffer overflow
                    if len(infinity_input) > 500000 and f.tell() % 10000 == 0:
                        time.sleep(0.05)
                        
            # Clean up
            os.unlink(temp_output_file.name)
            
        except Exception as e:
            sys.stderr.write(f"\nError with large file output: {e}\n")
            # Fallback to direct output
            try:
                # Very small chunks for direct output
                chunk_size = 100
                for i in range(0, len(infinity_input), chunk_size):
                    sys.stdout.write(infinity_input[i:i+chunk_size])
                    sys.stdout.flush()
                    if i % 5000 == 0:
                        time.sleep(0.01)
            except Exception as e2:
                sys.stderr.write(f"\nFallback output also failed: {e2}\n")
    else:
        # For smaller content, use standard chunked output
        chunk_size = 500
        try:
            for i in range(0, len(infinity_input), chunk_size):
                sys.stdout.write(infinity_input[i:i+chunk_size])
                sys.stdout.flush()
            
            # Ensure we end with a newline
            if not infinity_input.endswith('\n'):
                sys.stdout.write('\n')
                sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"\nError during output: {e}\n")
    
    # Force garbage collection after large output
    gc.collect()
else:
    print("(no input provided)", flush=True)