// --- Supabase সংযোগ স্থাপন ---
const SUPABASE_URL = "https://fldtxkwxzkcwdxseqlmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHR4a3d4emtjd2R4c2VxbG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MjYwNjcsImV4cCI6MjA3MTUwMjA2N30.BM7c1BLAZ4rwxzWlEBOJyK4rLBSmz52aq_UA7CFQBLM";
document.addEventListener('DOMContentLoaded', () => {
    const signupView = document.getElementById('signup-view');
    const loginView = document.getElementById('login-view');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const userTokenDisplay = document.getElementById('user-token-display');
    const newUserTokenSpan = document.getElementById('new-user-token');

    // --- View Switching ---
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.style.display = 'none';
        loginView.style.display = 'block';
        userTokenDisplay.style.display = 'none'; // Hide token display when switching
        signupForm.reset();
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    });

    // --- Sign Up Logic ---
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const password = document.getElementById('signup-password').value;
        
        // Create a unique user tag (token)
        const userTag = name.toLowerCase().replace(/\s+/g, '') + Math.floor(1000 + Math.random() * 9000);
        
        // Supabase expects email or phone for sign up, we'll use a "dummy" email
        const email = `${userTag}@example.com`;

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { 
                    full_name: name,
                    user_tag: userTag 
                }
            }
        });

        if (error) {
            alert("ত্রুটি: " + error.message);
        } else {
            // Show the generated user tag to the user
            newUserTokenSpan.textContent = userTag;
            userTokenDisplay.style.display = 'block';
            signupForm.style.display = 'none';
        }
    });

    // --- Login Logic ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userTag = document.getElementById('login-token').value;
        const password = document.getElementById('login-password').value;
        const email = `${userTag}@example.com`;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert("ত্রুটি: " + error.message);
        } else {
            // Redirect to dashboard on successful login
            window.location.href = 'dashboard.html';
        }
    });
});