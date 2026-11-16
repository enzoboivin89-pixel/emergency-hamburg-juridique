PORTAIL JURIDIQUE — EMERGENCY HAMBURG RP
=========================================

VERSION 1 — MAQUETTE FONCTIONNELLE LOCALE

CONTENU
- Accueil et navigation responsive
- Formulaires de demande de carte d'identité RP, permis RP et carte grise RP
- Code pénal RP d'exemple avec recherche et filtre
- Formulaire de demande au tribunal
- Panneau local de consultation et export JSON des demandes

OUVRIR LE SITE
1. Décompressez le fichier ZIP.
2. Ouvrez le fichier index.html dans un navigateur récent.

IMPORTANT — LIMITES DE CETTE VERSION
Cette version est une démonstration front-end : les demandes sont conservées dans le stockage local du navigateur utilisé.
Elles ne sont PAS envoyées à un serveur et ne sont PAS visibles par les autres joueurs.
Le panneau Administration n'est pas protégé par une authentification.
Ne saisissez aucune donnée personnelle réelle.
Les documents et infractions sont fictifs et destinés uniquement au RolePlay.

MISE EN LIGNE
Pour publier le site, créez un dépôt GitHub, ajoutez les trois fichiers (index.html, style.css, app.js), puis importez le dépôt dans Vercel.
La version publique nécessitera ensuite un backend et une base de données pour partager les demandes entre joueurs, une authentification et des permissions pour les agents.
Ne mettez jamais de token Discord ou de mot de passe dans les fichiers front-end.

PROCHAINE ÉTAPE CONSEILLÉE
Ajouter une base de données, une connexion sécurisée et des rôles (Joueur, Mairie, Police, Avocat, Procureur, Juge, Administrateur), puis connecter Discord côté serveur.
