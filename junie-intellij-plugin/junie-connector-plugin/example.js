/**
 * Example usage of the Junie Connector Plugin
 */

const JunieConnector = require('./index');

// Create a new instance of the JunieConnector
const junieConnector = new JunieConnector({
  // You can customize the path to the Junie directory if needed
  // juniePath: '/custom/path/to/.junie',
  logLevel: 'info'
});

// Function to demonstrate session initialization
async function demonstrateSessionInitialization() {
  console.log('Demonstrating Junie Connector Plugin usage...\n');
  
  // Initialize a session with some configuration
  console.log('Initializing a new session...');
  const sessionId = junieConnector.initializeSession({
    name: 'Example Session',
    description: 'A session created for demonstration purposes',
    metadata: {
      createdBy: 'example.js',
      purpose: 'demonstration'
    }
  });
  
  if (!sessionId) {
    console.error('Failed to initialize session. Make sure Junie is properly installed.');
    return;
  }
  
  console.log(`Session initialized with ID: ${sessionId}\n`);
  
  // Get and display the session status
  console.log('Getting session status...');
  const status = junieConnector.getSessionStatus();
  console.log('Session status:', JSON.stringify(status, null, 2), '\n');
  
  // Simulate some work being done in the session
  console.log('Performing work in the session...');
  await simulateWork(2000);
  console.log('Work completed.\n');
  
  // Terminate the session
  console.log('Terminating the session...');
  const terminated = junieConnector.terminateSession();
  
  if (terminated) {
    console.log('Session terminated successfully.\n');
  } else {
    console.error('Failed to terminate session.\n');
  }
  
  // Verify the session is no longer active
  console.log('Verifying session status after termination...');
  const finalStatus = junieConnector.getSessionStatus();
  console.log('Final session status:', JSON.stringify(finalStatus, null, 2), '\n');
  
  console.log('Demonstration completed.');
}

// Helper function to simulate async work
function simulateWork(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demonstration
demonstrateSessionInitialization().catch(error => {
  console.error('Error during demonstration:', error);
});