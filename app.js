const SUPABASE_URL = "https://enpgpjnbdhflhqoyxfle.supabase.co";
const SUPABASE_KEY = "sb_publishable_FvII21FY0B25zR7g2izE5g_KA9PmkmA";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (selector) => document.querySelector(selector);

let authMode = "login";
let adminDocs = [];
let adminCases = [];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// CONNEXION ET INSCRIPTION

function openAuth(mode) {
  authMode = mode;

  $("#authTitle").textContent =
    mode === "login" ? "Connexion" : "Créer un compte";

  $("#authSubmit").textContent =
    mode === "login" ? "Se connecter" : "Créer mon compte";

  $("#authStatus").textContent = "";
  $("#authDialog").showModal();
}

$("#loginBtn").addEventListener("click", () => openAuth("login"));
$("#registerBtn").addEventListener("click", () => openAuth("register"));
$("#closeAuth").addEventListener("click", () => $("#authDialog").close());

$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;

  $("#authSubmit").disabled = true;
  $("#authStatus").textContent = "Veuillez patienter...";

  try {
    const result = authMode === "register"
      ? await supabaseClient.auth.signUp({ email, password })
      : await supabaseClient.auth.signInWithPassword({ email, password });

    if (result.error) {
      $("#authStatus").textContent = result.error.message;
      return;
    }

    if (authMode === "register" && !result.data.session) {
      $("#authStatus").textContent =
        "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.";
      return;
    }

    $("#authStatus").textContent = "Connexion réussie !";
    $("#authDialog").close();
    await updateAuthDisplay();

  } catch (error) {
    $("#authStatus").textContent = error.message;
  } finally {
    $("#authSubmit").disabled = false;
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  await updateAuthDisplay();
});

// AFFICHAGE DU COMPTE ET DES DROITS ADMIN

async function updateAuthDisplay() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error(error);
    return;
  }

  const user = data.user;

  $("#loginBtn").hidden = !!user;
  $("#registerBtn").hidden = !!user;
  $("#logoutBtn").hidden = !user;
  $("#userEmail").textContent = user ? user.email : "";

  if (!user) {
    $("#administration").hidden = true;
    adminDocs = [];
    adminCases = [];
    $("#docCount").textContent = "0";
    $("#caseCount").textContent = "0";
    return;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Vérification administrateur :", adminError);
    $("#administration").hidden = true;
    return;
  }

  const isAdmin = !!admin;
  $("#administration").hidden = !isAdmin;

  if (isAdmin) {
    await loadAdminData();
  }
}

supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(() => updateAuthDisplay(), 0);
});

// CODE PENAL

const penal = [
  ["Excès de vitesse", "Circulation", "250 $", "—"],
  ["Conduite dangereuse", "Circulation", "500 $", "5 min"],
  ["Stationnement gênant", "Circulation", "150 $", "—"],
  ["Coups et blessures", "Atteintes aux personnes", "750 $", "10 min"],
  ["Menaces", "Atteintes aux personnes", "400 $", "5 min"],
  ["Vol", "Atteintes aux biens", "600 $", "8 min"],
  ["Dégradation de véhicule", "Atteintes aux biens", "450 $", "6 min"],
  ["Refus d'obtempérer", "Ordre public", "500 $", "8 min"],
  ["Trouble à l'ordre public", "Ordre public", "300 $", "—"]
];

function renderPenal() {
  const q = $("#penalSearch").value.toLowerCase();
  const category = $("#penalCategory").value;

  $("#penalRows").innerHTML = penal
    .filter(row =>
      (!q || row[0].toLowerCase().includes(q)) &&
      (!category || row[1] === category)
    )
    .map(row =>
      `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`
    )
    .join("") || '<tr><td colspan="4">Aucun résultat.</td></tr>';
}

$("#penalSearch").addEventListener("input", renderPenal);
$("#penalCategory").addEventListener("change", renderPenal);

// DEMANDES DE DOCUMENTS

document.querySelectorAll("[data-form]").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.form;

    const config = {
      identity: [
        "Demande de carte d'identité",
        ""
      ],
      license: [
        "Demande de permis de conduire",
        `<label>Catégorie souhaitée
          <select name="category" required>
            <option value="">Choisir…</option>
            <option>A — Moto</option>
            <option>B — Voiture</option>
            <option>C — Poids lourd</option>
          </select>
        </label>`
      ],
      vehicle: [
        "Demande de carte grise",
        `<label>Marque et modèle RP
          <input name="vehicle" required maxlength="80">
        </label>
        <label>Immatriculation RP
          <input name="plate" required maxlength="15">
        </label>`
      ]
    };

    $("#dialogTitle").textContent = config[type][0];
    $("#documentType").value = type;
    $("#extraFields").innerHTML = config[type][1];
    $("#docStatus").textContent = "";
    $("#requestDialog").showModal();
  });
});

// FERMETURE DU FORMULAIRE DOCUMENT

$("#requestDialog .close").addEventListener("click", (e) => {
  e.preventDefault();
  $("#requestDialog").close();
});

// ENVOI D'UNE DEMANDE DE DOCUMENT

$("#documentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    $("#docStatus").textContent =
      "Connecte-toi pour envoyer une demande.";
    return;
  }

  const formData = new FormData(e.currentTarget);
  const obj = Object.fromEntries(formData.entries());

  if (!obj.name || !obj.birth) {
    $("#docStatus").textContent =
      "Merci de compléter les champs obligatoires.";
    return;
  }

  const details = { ...obj };
  delete details.name;
  delete details.birth;
  delete details.documentType;

  $("#submitDoc").disabled = true;
  $("#docStatus").textContent = "Envoi en cours...";

  try {
    const { error } = await supabase
      .from("demandes_documents")
      .insert({
        user_id: user.id,
        type: $("#dialogTitle").textContent,
        name: obj.name,
        birth: obj.birth,
        details,
        status: "À examiner"
      });

    if (error) throw error;

    $("#docStatus").textContent =
      "Demande envoyée avec succès !";

    e.currentTarget.reset();

    await loadAdminData();

    setTimeout(() => $("#requestDialog").close(), 1200);

  } catch (error) {
    $("#docStatus").textContent = "Erreur : " + error.message;
  } finally {
    $("#submitDoc").disabled = false;
  }
});

// DEMANDES AU TRIBUNAL

$("#caseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    $("#caseStatus").textContent =
      "Connecte-toi pour déposer un dossier.";
    return;
  }

  const formData = new FormData(e.currentTarget);
  const obj = Object.fromEntries(formData.entries());

  $("#caseStatus").textContent = "Envoi en cours...";

  try {
    const { error } = await supabase
      .from("dossiers_tribunal")
      .insert({
        user_id: user.id,
        name: obj.name,
        kind: obj.kind,
        person: obj.person || null,
        details: obj.details,
        status: "À examiner"
      });

    if (error) throw error;

    $("#caseStatus").textContent =
      "Votre demande a bien été envoyée !";

    e.currentTarget.reset();

    await loadAdminData();

  } catch (error) {
    $("#caseStatus").textContent =
      "Erreur : " + error.message;
  }
});

// CHARGEMENT DES DEMANDES POUR L'ADMINISTRATION

async function loadAdminData() {
  const { data: docs, error: docsError } = await supabase
    .from("demandes_documents")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: cases, error: casesError } = await supabase
    .from("dossiers_tribunal")
    .select("*")
    .order("created_at", { ascending: false });

  if (docsError || casesError) {
    console.error(docsError || casesError);
    $("#requestsList").textContent =
      "Impossible de charger les demandes.";
    return;
  }

  adminDocs = docs || [];
  adminCases = cases || [];

  renderAdmin();
}

function renderAdmin() {
  $("#docCount").textContent = adminDocs.length;
  $("#caseCount").textContent = adminCases.length;

  const all = [
    ...adminDocs.map(item => ({
      ...item,
      group: "Document",
      label: item.type
    })),
    ...adminCases.map(item => ({
      ...item,
      group: "Tribunal",
      label: item.kind
    }))
  ].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  $("#requestsList").innerHTML = all.length
    ? all.map(item => `
      <div class="request-item">
        <span>
          <b>${escapeHtml(item.group)} · ${escapeHtml(item.label)}</b>
          <br>
          ${escapeHtml(item.name)}
          — ${new Date(item.created_at).toLocaleString("fr-FR")}
        </span>
        <span>${escapeHtml(item.status || "À examiner")}</span>
      </div>
    `).join("")
    : '<p class="muted">Aucune demande pour le moment.</p>';
}

// EXPORT DES DEMANDES

$("#exportBtn").addEventListener("click", () => {
  const content = {
    documents: adminDocs,
    tribunal: adminCases
  };

  const blob = new Blob(
    [JSON.stringify(content, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "demandes-emergency-hamburg-rp.json";
  link.click();

  URL.revokeObjectURL(url);
});

// MENU MOBILE

$("#menuBtn").addEventListener("click", () => {
  $("#nav").classList.toggle("open");
});

// INITIALISATION

renderPenal();
updateAuthDisplay();
