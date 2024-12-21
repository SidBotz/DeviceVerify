window.onload = async function () {
    const params = new URLSearchParams(window.location.search);
    const userid = params.get("userid");
    const linktype = params.get("linktype");
    const redirectlink = decodeURIComponent(params.get("redirectlink"));
    const verificationMessage = document.getElementById("verificationMessage");
    const animation = document.getElementById("animation");
    const verificationStatus = document.getElementById("verificationStatus");
    const redirectLink = document.getElementById("redirectLink");

    // Simulate fetching task status and checking completion time
    const taskCompletedTime = 1625000000000; // Example timestamp of task completion
    const currentTime = new Date().getTime();
    const elapsedTime = (currentTime - taskCompletedTime) / (1000 * 60 * 60); // in hours

    if (elapsedTime > 6) {
        // Task is completed and more than 6 hours have passed
        verificationStatus.textContent = "Task verified successfully!";
        verificationMessage.textContent = "You can now proceed to your task link.";
        setTimeout(() => {
            window.location.href = redirectlink;
        }, 2000);
    } else {
        // Task is completed, but not enough time has passed
        const remainingTime = 6 - elapsedTime;
        verificationStatus.textContent = `You have already completed this task, but you need to wait ${Math.ceil(remainingTime)} hours before doing it again.`;
        redirectLink.innerHTML = `<a href="https://t.me/PaisaEarnBot/tasks" target="_blank">Click here for another task</a>`;
    }
};
