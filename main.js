// ----- Token and Network Configuration -----
const SOL_MINT = "So11111111111111111111111111111111111111112"; // SOL Mint Address
const ZAOCO_MINT = "2TcMhXggLDRKNUpkHZU7oPGhMBgFPhVRErpTvA9AdTLm"; // Replace with the actual ZaoCO Mint Address
const SOLANA_NETWORK = solanaWeb3.clusterApiUrl("devnet"); // Use devnet for testing

let publicKey = null;

/**
 * Connects to the Phantom wallet.
 * @async
 */
async function connectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.disabled = true; // Disable button during connection attempt
    walletStatus.textContent = "Connecting...";

    try {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error("Phantom Wallet not found! Install it from https://phantom.app");
        }

        const provider = window.solana;
        const response = await provider.connect();
        publicKey = response.publicKey;

        walletStatus.textContent = `Connected: ${publicKey.toString()}`;
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        console.log("Connected:", publicKey.toString());

        // Attach Phantom event listeners (if not already attached) - important to ensure these aren't attached multiple times
        if (!window.phantomEventListenersAttached) {
            window.solana.on("connect", onPhantomConnect);
            window.solana.on("disconnect", onPhantomDisconnect);
            window.phantomEventListenersAttached = true; // Prevent re-attaching
        }


    } catch (err) {
        console.error("Connection error:", err);
        walletStatus.textContent = err.message;
        alert(err.message);
    } finally {
        connectButton.disabled = publicKey !== null; // Re-enable if connection failed
        disconnectButton.disabled = publicKey === null;
    }
}


/**
 * Disconnects from the Phantom wallet.
 * @async
 */
async function disconnectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    disconnectButton.disabled = true; // Disable button during disconnection attempt
    walletStatus.textContent = "Disconnecting...";

    try {
        if (!window.solana) {
            throw new Error("Phantom Wallet not found.");
        }

        await window.solana.disconnect();
        onPhantomDisconnect(); // Manually call the disconnect handler

    } catch (error) {
        console.error("Disconnection failed:", error);
        walletStatus.textContent = `Disconnection Failed: ${error.message}`;
    } finally {
        connectButton.disabled = publicKey !== null;
        disconnectButton.disabled = publicKey === null;
    }
}

/**
 * Handles the Phantom `connect` event.
 * @param {solanaWeb3.PublicKey} newPublicKey The new public key.
 */
function onPhantomConnect(newPublicKey) {
    console.log("Wallet connected (event):", newPublicKey.toString());
    publicKey = newPublicKey;
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    walletStatus.textContent = `Connected: ${publicKey.toString()}`;
    connectButton.disabled = true;
    disconnectButton.disabled = false;

}

/**
 * Handles the Phantom `disconnect` event.
 */
function onPhantomDisconnect() {
    console.log("Wallet disconnected (event)");
    publicKey = null;
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    walletStatus.textContent = "Not connected";
    connectButton.disabled = false;
    disconnectButton.disabled = true;

}


document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.addEventListener("click", connectWallet);
    disconnectButton.addEventListener("click", disconnectWallet);
});