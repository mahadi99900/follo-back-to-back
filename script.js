// --- ধাপ ১: Supabase সংযোগ স্থাপন ---
const SUPABASE_URL = "https://fldtxkwxzkcwdxseqlmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZHR4a3d4emtjd2R4c2VxbG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MjYwNjcsImV4cCI6MjA3MTUwMjA2N30.BM7c1BLAZ4rwxzWlEBOJyK4rLBSmz52aq_UA7CFQBLM";

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentPostId = null; // কোন পোস্টের উপর কাজ করা হচ্ছে তা মনে রাখার জন্য

// --- ধাপ ২: সকল ফাংশন ---

// গুগল দিয়ে লগইন
async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}

// লগআউট
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// ব্যবহারকারীর লগইন অবস্থা যাচাই করা
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const path = window.location.pathname;

    if (session && (path.endsWith('/') || path.includes('login.html'))) {
        window.location.href = 'dashboard.html';
    } else if (!session && (path.includes('dashboard.html') || path.includes('reviews.html'))) {
        window.location.href = 'login.html';
    }
    
    if (session) {
        if (path.includes('dashboard.html')) {
            document.getElementById('user-email').innerText = session.user.email;
            fetchPosts();
            fetchUserPoints(session.user.id);
        }
        if (path.includes('reviews.html')) {
            fetchPendingReviews(session.user.id);
        }
    }
}

// ব্যবহারকারীর পয়েন্ট নিয়ে আসা
async function fetchUserPoints(userId) {
    const { data, error } = await supabase.from('users').select('points').eq('id', userId).single();
    if (error) {
        console.error("Error fetching points:", error);
    } else if (data) {
        document.getElementById('user-points').innerText = data.points;
    }
}

// ডাটাবেস থেকে সকল সক্রিয় পোস্ট নিয়ে আসা
async function fetchPosts() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'active') // শুধুমাত্র সক্রিয় পোস্ট দেখাও
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching posts:', error);
    else renderPosts(posts);
}

// পোস্টগুলো HTML হিসেবে ওয়েবসাইটে দেখানো
function renderPosts(posts) {
    const postListDiv = document.getElementById('post-list');
    if (!postListDiv) return;
    postListDiv.innerHTML = ''; 
    if (posts.length === 0) { 
        postListDiv.innerHTML = '<p>এখনো কোনো কাজ পোস্ট করা হয়নি।</p>'; 
        return; 
    }
    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `<h3>কাজ: ${post.interaction_type}</h3><p class="post-description">বিবরণ: ${post.description || 'দেওয়া হয়নি'}</p><a href="${post.facebook_url}" class="post-link" target="_blank">লিঙ্কে যান</a><button class="complete-task-btn" onclick="openProofModal(${post.id})">কাজটি সম্পন্ন করুন</button>`;
        postListDiv.appendChild(postCard);
    });
}

// নতুন পোস্ট তৈরি করা
async function createPost(event) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("অনুগ্রহ করে আবার লগইন করুন।"); return; }
    
    const facebookUrl = document.getElementById('facebook-url').value;
    const interactionType = document.getElementById('interaction-type').value;
    const description = document.getElementById('description').value;
    
    const { error } = await supabase.from('posts').insert([{ user_id: user.id, facebook_url: facebookUrl, interaction_type: interactionType, description: description }]);
    
    if (error) { 
        alert('দুঃখিত, আপনার পোস্টটি তৈরি করা যায়নি।'); 
        console.error('Error creating post:', error); 
    } else { 
        alert('আপনার কাজটি সফলভাবে পোস্ট করা হয়েছে!'); 
        fetchPosts(); 
        document.getElementById('create-post-form').reset(); 
    }
}

// প্রমাণ জমা দেওয়ার মোডাল খোলা ও বন্ধ করা
function openProofModal(postId) { 
    currentPostId = postId; 
    document.getElementById('proof-modal').style.display = 'flex'; 
}

function closeProofModal() { 
    currentPostId = null; 
    document.getElementById('proof-modal').style.display = 'none'; 
    document.getElementById('proof-form').reset(); 
}

// স্ক্রিনশট আপলোড এবং প্রমাণ জমা দেওয়া
async function submitProof(event) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("অনুগ্রহ করে আবার লগইন করুন।"); return; }
    
    const screenshotFile = document.getElementById('screenshot-file').files[0];
    const commenterFacebookUrl = document.getElementById('commenter-facebook-url').value;
    if (!screenshotFile || !commenterFacebookUrl) { alert("অনুগ্রহ করে সব তথ্য পূরণ করুন।"); return; }

    const fileName = `${user.id}_${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('proof_screenshots').upload(fileName, screenshotFile);
    if (uploadError) { console.error('Error uploading file:', uploadError); alert('দুঃখিত, ফাইল আপলোড করা যায়নি।'); return; }
    
    const { data } = supabase.storage.from('proof_screenshots').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: commentError } = await supabase.from('comments').insert([{ post_id: currentPostId, commenter_id: user.id, screenshot_url: publicUrl, commenter_facebook_url: commenterFacebookUrl }]);
    if (commentError) { 
        console.error('Error submitting proof:', commentError); 
        alert('দুঃখিত, আপনার প্রমাণ জমা দেওয়া যায়নি।'); 
    } else { 
        await supabase.from('posts').update({ status: 'pending' }).eq('id', currentPostId); 
        alert('আপনার কাজের প্রমাণ সফলভাবে জমা দেওয়া হয়েছে!'); 
        closeProofModal(); 
        fetchPosts(); 
    }
}

// রিভিউয়ের জন্য অপেক্ষারত পোস্ট নিয়ে আসা
async function fetchPendingReviews(userId) {
    const { data, error } = await supabase
        .from('posts')
        .select(`*, comments ( commenter_id, screenshot_url )`)
        .eq('user_id', userId)
        .eq('status', 'pending');

    if (error) console.error('Error fetching reviews:', error);
    else renderPendingReviews(data);
}

// রিভিউ পোস্টগুলো ওয়েবসাইটে দেখানো
function renderPendingReviews(reviews) {
    const reviewListDiv = document.getElementById('review-list');
    if (!reviewListDiv) return;
    reviewListDiv.innerHTML = '';

    if (reviews.length === 0) {
        reviewListDiv.innerHTML = '<p>রিভিউয়ের জন্য কোনো কাজ নেই।</p>';
        return;
    }

    reviews.forEach(review => {
        const commenterId = review.comments[0]?.commenter_id;
        const screenshotUrl = review.comments[0]?.screenshot_url;

        if (!commenterId || !screenshotUrl) return;

        const reviewCard = document.createElement('div');
        reviewCard.className = 'post-card';
        reviewCard.innerHTML = `
            <h3>কাজ: ${review.interaction_type}</h3>
            <p>প্রমাণ: <a href="${screenshotUrl}" target="_blank">স্ক্রিনশট দেখুন</a></p>
            <button onclick="confirmTransaction(${review.id}, '${review.user_id}', '${commenterId}')">কাজটি নিশ্চিত করুন</button>
        `;
        reviewListDiv.appendChild(reviewCard);
    });
}

// কাজ নিশ্চিত করে উভয়কে পয়েন্ট দেওয়া
async function confirmTransaction(postId, ownerId, commenterId) {
    const { error: ownerError } = await supabase.rpc('increment_points', { user_id_to_update: ownerId });
    const { error: commenterError } = await supabase.rpc('increment_points', { user_id_to_update: commenterId });

    if (ownerError || commenterError) {
        console.error("Error updating points:", ownerError || commenterError);
        alert("পয়েন্ট আপডেট করতে সমস্যা হয়েছে।");
        return;
    }

    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('posts').delete().eq('id', postId);

    alert("কাজ সফলভাবে নিশ্চিত করা হয়েছে! উভয়কে ১ পয়েন্ট করে দেওয়া হয়েছে।");
    fetchPendingReviews(ownerId); // রিভিউ তালিকা রিফ্রেশ করা
}

// --- ধাপ ৩: Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    
    const loginButton = document.getElementById('google-login-btn');
    if (loginButton) loginButton.addEventListener('click', loginWithGoogle);

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) logoutButton.addEventListener('click', logout);
    
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) createPostForm.addEventListener('submit', createPost);
    
    const proofForm = document.getElementById('proof-form');
    if (proofForm) proofForm.addEventListener('submit', submitProof);

    const cancelProofBtn = document.getElementById('cancel-proof-btn');
    if (cancelProofBtn) cancelProofBtn.addEventListener('click', closeProofModal);
});
