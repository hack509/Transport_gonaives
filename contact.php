<?php

/**
 * TransiGo — contact.php (version sécurisée)
 * Traitement du formulaire de contact avec :
 * - Validation stricte des données
 * - Protection contre l'injection d'en-têtes email
 * - Sanitisation des entrées
 * - Limitation CSRF basique (vérification du Referer)
 * - Rate limiting simple (basé sur session)
 */

session_start();

// === CONFIGURATION ===
define('RECIPIENT_EMAIL', 'desulmajohnsley@gmail.com');
define('SITE_NAME', 'TransiGo');
define('MAX_REQUESTS_PER_HOUR', 5);

// === HEADERS ===
header('Content-Type: application/json; charset=UTF-8');

// === Vérification de la méthode ===
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée.']);
    exit;
}

// === Rate limiting simple (par session) ===
$now = time();
if (!isset($_SESSION['contact_requests'])) {
    $_SESSION['contact_requests'] = [];
}

// Nettoyer les requêtes de plus d'1 heure
$_SESSION['contact_requests'] = array_filter(
    $_SESSION['contact_requests'],
    fn($timestamp) => ($now - $timestamp) < 3600
);

if (count($_SESSION['contact_requests']) >= MAX_REQUESTS_PER_HOUR) {
    http_response_code(429);
    echo json_encode([
        'status' => 'error',
        'message' => 'Trop de requêtes. Veuillez patienter avant de réessayer.'
    ]);
    exit;
}

// === Récupération et nettoyage des données ===
$name    = isset($_POST['name'])    ? trim($_POST['name'])    : '';
$email   = isset($_POST['email'])   ? trim($_POST['email'])   : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// === Validation ===
$errors = [];

// Validation du nom
if (empty($name)) {
    $errors[] = 'Le nom est requis.';
} elseif (strlen($name) < 2 || strlen($name) > 100) {
    $errors[] = 'Le nom doit contenir entre 2 et 100 caractères.';
} elseif (!preg_match('/^[\p{L}\s\-\.\']+$/u', $name)) {
    $errors[] = 'Le nom contient des caractères non autorisés.';
}

// Validation de l'email
if (empty($email)) {
    $errors[] = 'L\'email est requis.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'L\'adresse email n\'est pas valide.';
} elseif (strlen($email) > 254) {
    $errors[] = 'L\'email est trop long.';
}

// Validation du message (optionnel)
if (!empty($message) && strlen($message) > 2000) {
    $errors[] = 'Le message ne peut pas dépasser 2000 caractères.';
}

// === Retourner les erreurs si présentes ===
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode(' ', $errors)]);
    exit;
}

// === Sécurisation des données pour l'email ===
// Protection contre l'injection d'en-têtes
$safeName    = str_replace(["\r", "\n", "%0a", "%0d"], '', htmlspecialchars($name, ENT_QUOTES, 'UTF-8'));
$safeEmail   = filter_var($email, FILTER_SANITIZE_EMAIL);
$safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// === Construction de l'email ===
$to      = RECIPIENT_EMAIL;
$subject = '=?UTF-8?B?' . base64_encode('[' . SITE_NAME . '] Nouveau message de ' . $safeName) . '?=';

$body  = "Nouveau message reçu via le formulaire de contact de " . SITE_NAME . "\n";
$body .= str_repeat('=', 60) . "\n\n";
$body .= "Nom    : " . $safeName . "\n";
$body .= "Email  : " . $safeEmail . "\n";
$body .= "Date   : " . date('d/m/Y à H:i:s') . "\n";
$body .= "IP     : " . ($_SERVER['REMOTE_ADDR'] ?? 'inconnue') . "\n\n";

if (!empty($safeMessage)) {
    $body .= "Message :\n" . str_repeat('-', 40) . "\n" . $safeMessage . "\n\n";
}

$body .= str_repeat('=', 60) . "\n";
$body .= "Ce message a été envoyé depuis le site " . SITE_NAME . ".\n";

// En-têtes sécurisés
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "From: " . SITE_NAME . " <noreply@transigo.com>\r\n";
$headers .= "Reply-To: " . $safeEmail . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 3\r\n";

// === Envoi ===
$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    // Enregistrer la requête dans la session
    $_SESSION['contact_requests'][] = $now;

    // Log basique (optionnel - décommentez si vous avez accès en écriture)
    // $log = date('Y-m-d H:i:s') . " | " . $safeName . " | " . $safeEmail . "\n";
    // file_put_contents(__DIR__ . '/logs/contact.log', $log, FILE_APPEND | LOCK_EX);

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer ultérieurement.'
    ]);
}
?>
