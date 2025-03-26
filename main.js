// ----- Token and Network Configuration -----
const SOL_MINT = "So11111111111111111111111111111111111111112"; // SOL Mint Address
const ZAOCO_MINT = "2TcMhXggLDRKNUpkHZU7oPGhMBgFPhVRErpTvA9AdTLm"; // Replace with the actual ZaoCO Mint Address
const SOLANA_NETWORK = "https://misty-radial-telescope.solana-mainnet.quiknode.pro/a003338ae943cccba5b8f9e7231c3dbda61eace0/";  // Use devnet for testing

let publicKey = null;

/**
 * Connects to the Phantom wallet.
 * @async
 */
async function connectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");
    const graph = document.getElementById("graph");

    connectButton.disabled = true; // Disable button during connection attempt
    walletStatus.textContent = "Connecting...";
    graph.style.display = "block";


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

        // Fetch and display the SOL balance
        await displaySolBalance();
        // Fetch and display the ZaoCO balance
        await displayTokenBalance(ZAOCO_MINT);


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
    const SOLbal = document.getElementById("SOLbal");
    const ZaoCObal = document.getElementById("ZaoCObal");
    const graph = document.getElementById("graph");

    disconnectButton.disabled = true; // Disable button during disconnection attempt
    walletStatus.textContent = "Disconnecting...";
    graph.style.display = "none";

    try {
        if (!window.solana) {
            throw new Error("Phantom Wallet not found.");
        }

        await window.solana.disconnect();
        onPhantomDisconnect();
        SOLbal.textContent = "SOL Balance: N/A";
        ZaoCObal.textContent = "ZAOCO Balance: N/A";

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
    displaySolBalance(); // Update balance on connect event
    displayTokenBalance(ZAOCO_MINT);

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
    const SOLbal = document.getElementById("SOLbal");
    const ZaoCObal = document.getElementById("ZaoCObal");

    walletStatus.textContent = "Not connected";
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    SOLbal.textContent = "SOL Balance: N/A";
    ZaoCObal.textContent = "ZAOCO Balance: N/A";


}

/**
 * Fetches and displays the SOL balance of the connected wallet.
 * @async
 */
async function displaySolBalance() {
    const SOLbal = document.getElementById("SOLbal");

    if (!publicKey) {
        SOLbal.textContent = "Balance: Not connected";
        return;
    }

    try {
        const connection = new solanaWeb3.Connection(SOLANA_NETWORK, "confirmed");
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL; // Convert lamports to SOL
        SOLbal.textContent = `SOL Balance: ${solBalance.toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        SOLbal.textContent = "Balance: Error fetching balance";
    }
}


/**
 * Fetches and displays the balance of a specified token for the connected wallet.
 * @async
 * @param {string} tokenMintAddress The mint address of the token.
 */
async function displayTokenBalance(tokenMintAddress) {
    const ZaoCObal = document.getElementById("ZaoCObal");

    if (!publicKey) {
        ZaoCObal.textContent = "Balance: Not connected";
        return;
    }

    try {
        const connection = new solanaWeb3.Connection(SOLANA_NETWORK, "confirmed");

        // Find the associated token account (ATA) for the user and the token mint
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new solanaWeb3.PublicKey(tokenMintAddress),
        });

        if (tokenAccounts.value.length === 0) {
           ZaoCObal.textContent = "ZAOCO Balance: 0 (No associated account)";
            return;
        }

        // Assuming only one associated token account exists for this mint
        const tokenAccount = tokenAccounts.value[0];
        const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount; // Use uiAmount for user-friendly balance

        ZaoCObal.textContent = `ZAOCO Balance: ${balance}`;
    } catch (error) {
        console.error("Error fetching ZaoCO balance:", error);
        ZaoCObal.textContent = "Balance: Error fetching balance";
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.addEventListener("click", connectWallet);
    disconnectButton.addEventListener("click", disconnectWallet);

    // Disable disconnect button initially if not connected
    disconnectButton.disabled = true;
});