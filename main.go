package main

import (
	"flag"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"time"
)

// Function to capture the screen
func captureScreen() string {
	var cmd *exec.Cmd
	outputFile := "screenshot.png"

	switch runtime.GOOS {
	case "darwin":
		// Command for macOS
		cmd = exec.Command("screencapture", outputFile)
	case "linux":
		// Command for Linux, requires 'scrot' to be installed
		cmd = exec.Command("scrot", outputFile)
	case "windows":
		// Updated command for Windows: captures the entire screen using PowerShell
		cmd = exec.Command("powershell", "-command", `
			Add-Type -AssemblyName System.Windows.Forms; 
			$bitmap = New-Object System.Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height);
			$graphics = [System.Drawing.Graphics]::FromImage($bitmap);
			$graphics.CopyFromScreen(0, 0, 0, 0, $bitmap.Size);
			$bitmap.Save('screenshot.png');
		`)
	default:
		log.Fatalf("Unsupported operating system")
	}

	// Execute the command to capture the screen
	err := cmd.Run()
	if err != nil {
		log.Fatalf("Error taking screenshot: %v", err)
	} else {
		log.Printf("Image captured as %v\n", outputFile)
	}

	return outputFile
}

// Function to copy the image to the clipboard
func copyToClipboard(imagePath string) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		// macOS: Use `pngpaste` or `pbcopy` with the appropriate tools (assuming `pngpaste` is installed)
		cmd = exec.Command("osascript", "-e", "set the clipboard to (read (POSIX file \""+imagePath+"\") as «class PNGf»)")

	case "linux":
		// Linux: Use `xclip` to copy the image to the clipboard
		cmd = exec.Command("xclip", "-selection", "clipboard", "-t", "image/png", "-i", imagePath)

	case "windows":
		// Windows: Use PowerShell to copy the image to the clipboard
		cmd = exec.Command("powershell", "-command", `
			Add-Type -AssemblyName System.Drawing;
			Add-Type -AssemblyName System.Windows.Forms;
			$bitmap = [System.Drawing.Bitmap]::FromFile("screenshot.png");
			$clipboard = [System.Windows.Forms.Clipboard]::SetImage($bitmap);
		`)

	default:
		log.Fatalf("Unsupported operating system for clipboard operation")
	}

	// Execute the command to copy the image to the clipboard
	err := cmd.Run()
	if err != nil {
		log.Fatalf("Error copying image to clipboard: %v", err)
	} else {
		log.Println("Screenshot copied to clipboard")
	}
}

// Function to start the web server
func serveEditor(imagePath string, port string) {
	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Serve the main editor page at the root
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/editor.html")
	})

	// Serve the captured image
	http.HandleFunc("/image", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, imagePath)
	})

	log.Printf("Opening editor at http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func main() {
	// Define flags
	serveFlag := flag.Bool("serve", false, "Starts the web server")
	portFlag := flag.String("port", "8080", "Port to start the web server on")
	timerFlag := flag.Int("timer", 0, "Countdown timer in seconds (optional)")

	// Parse flags
	flag.Parse()

	// Start countdown timer if specified
	if *timerFlag > 0 {
		for i := *timerFlag; i > 0; i-- {
			log.Printf("Time remaining: %d seconds", i)
			time.Sleep(1 * time.Second)
		}
		log.Println("Countdown finished")
	}

	// Capture the screen
	imagePath := captureScreen()

	// Copy the image to the clipboard
	copyToClipboard(imagePath)

	// Start the server if the -serve flag is set
	if *serveFlag {
		serveEditor(imagePath, *portFlag)
	}
}
