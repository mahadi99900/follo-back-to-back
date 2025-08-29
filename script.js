document.addEventListener('DOMContentLoaded', () => {
    const signupView = document.getElementById('signup-view');
    const loginView = document.getElementById('login-view');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');

    // Switch to Login view
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.style.display = 'none';
        loginView.style.display = 'block';
    });

    // Switch to Sign Up view
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    });

    // --- Supabase logic will be added here in the next part ---
});