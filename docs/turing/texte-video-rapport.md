# Projet : la machine de Turing — texte à lire sur la vidéo

Vidéo tirée du rapport « Projet_Machine_de_Turing ». Durée : 24:48.
L'introduction générale et la conclusion générale sont celles du rapport, mot pour mot ; les chapitres en reprennent tous les points sous une forme plus courte.
Chaque passage commence au minutage indiqué ; le rythme prévu est celui d'une lecture posée à voix haute (environ 155 mots par minute).
Au début de chaque chapitre, un écran titre s'affiche environ deux secondes : tu peux commencer la phrase dessus.
La vidéo n'a pas de musique, seulement des bruitages discrets aux changements de scène.
Photos d'Alan Turing, de David Hilbert et de Kurt Gödel : Wikimedia Commons.


## Introduction générale  ·  00:01


### Présentation générale du sujet

**[00:01]** Ce projet est consacré à la **machine de Turing**, le modèle mathématique qui donne un sens précis au mot « calcul ».  
**[00:12]** Imaginée par **Alan Turing** en **1936**, elle se compose d’un ruban, d’une tête de lecture et d’écriture, d’un ensemble fini d’états et d’une table de règles.  
**[00:23]** Malgré cette grande simplicité, elle peut exécuter n’importe quel algorithme, et elle reste aujourd’hui la référence de l’informatique théorique, de la calculabilité jusqu’à la théorie de la complexité.  

### Contexte historique et naissance de la machine de Turing

**[00:34]** Au début du XXe siècle, les mathématiciens cherchent à fonder les mathématiques sur des bases parfaitement sûres.  
**[00:45]** En **1928**, **David Hilbert** pose l’**Entscheidungsproblem**, ou « problème de la décision » : existe-t-il une méthode mécanique capable de décider si n’importe quel énoncé logique est démontrable ? À cette époque, personne ne sait définir précisément ce qu’est une « méthode mécanique ».  
**[01:03]** En **1931**, **Kurt Gödel** montre avec ses théorèmes d’incomplétude que tout système formel suffisamment riche contient des énoncés vrais mais indémontrables. En **1936**, **Alonzo Church**, avec le lambda-calcul, et **Alan Turing**, avec sa machine, répondent indépendamment à Hilbert : il n’existe pas de méthode mécanique générale.  
**[01:22]** Pour y parvenir, Turing décrit une machine imaginaire qui imite un humain en train de calculer avec un crayon et du papier. Cette machine, conçue avant même l’existence des ordinateurs, est à l’origine de l’informatique moderne.  

### Problématique du projet

**[01:37]** Notre travail cherche à répondre à la question suivante :  
> Comment un modèle aussi simple, composé d’un ruban, d’une tête et de quelques règles, peut-il définir ce qu’un ordinateur peut calculer, et en combien de temps ?


### Objectifs du projet

**[01:54]** Les objectifs de ce projet sont les suivants :  
– retracer l’histoire d’Alan Turing et les raisons de la naissance de sa machine ;  
– décrire la structure de la machine de Turing, sa définition mathématique et son fonctionnement pas à pas ;  
– présenter et comparer les différents types de machines de Turing ;  
– étudier la notion de calculabilité, les problèmes décidables et indécidables, et le problème de l’arrêt ;  
– analyser la complexité des calculs et les classes P, NP, PSPACE et EXPTIME ;  
– illustrer ces notions par des exemples pratiques simulés et analyser leur complexité ;  
– dresser un bilan des avantages, des limites et des perspectives de ce modèle.  

### Organisation du travail

**[02:40]** Le document est organisé en sept chapitres. Le **chapitre I** présente Alan Turing et le contexte de la naissance de sa machine. Le **chapitre II** décrit sa structure, sa définition mathématique et son fonctionnement, illustré par une simulation complète. Le **chapitre III** compare les différents types de machines de Turing. Le **chapitre IV** est consacré à la calculabilité et au problème de l’arrêt, et le **chapitre V** à la théorie de la complexité. Le **chapitre VI** présente des exemples pratiques et analyse leur complexité. Enfin, le **chapitre VII** dresse le bilan des avantages, des limites et des perspectives de la machine de Turing, avant la conclusion générale.  

## Chapitre 1 — Généralités et historique  ·  03:25

**[03:25]** Chapitre 1. Alan Mathison Turing naît le 23 juin 1912 à Londres. Très tôt, il montre un génie pour les mathématiques et les sciences.  
**[03:35]** Élève jugé brouillon, il est marqué par la mort de son ami Christopher Morcom en 1930, qui renforce sa détermination.  
**[03:44]** En 1931, il entre au King's College de Cambridge, publie son article fondateur en 1936, puis prépare un doctorat à Princeton avec Alonzo Church.  
**[03:54]** Pendant la guerre, à Bletchley Park, il conçoit avec Gordon Welchman la Bombe, qui déchiffre les messages de la machine Enigma.  
**[04:03]** Le calculateur Colossus, de Tommy Flowers, s'attaque lui au chiffre de la machine Lorenz.  
**[04:10]** Après la guerre, il conçoit l'ACE. Condamné en 1952 pour son homosexualité, il meurt en 1954, à 41 ans. Il est réhabilité en 2013.  
**[04:20]** La machine naît d'une question de Hilbert : existe-t-il une méthode mécanique pour décider si un énoncé est démontrable ?  
**[04:29]** En 1936, dans son article sur les nombres calculables, Turing doit d'abord définir ce qu'est une méthode mécanique : la machine de Turing est née.  
**[04:39]** Définition : c'est un modèle abstrait qui exécute un algorithme, en lisant et écrivant des symboles sur un ruban infini, selon un nombre fini de règles.  
**[04:50]** La thèse de Church-Turing affirme qu'elle résout tout problème algorithmique. Indémontrable, elle n'a jamais été contredite.  
**[04:58]** Turing imite un humain qui calcule sur papier : regarder un symbole, l'écrire ou l'effacer, se déplacer, changer d'état d'esprit.  
**[05:06]** Il inverse la question : au lieu d'une méthode par problème, une seule machine pour tout algorithme.  
**[05:14]** Elle définit rigoureusement l'algorithme et prouve que certains problèmes n'ont aucune solution mécanique : la réponse à Hilbert est non.  
**[05:23]** Elle inspire le programme enregistré, l'architecture de von Neumann et nos ordinateurs. Un langage est Turing-complet s'il peut la simuler.  
**[05:31]** Bien que rudimentaire, elle a la même puissance que n'importe quel ordinateur, avec assez de mémoire et de temps.  
**[05:40]** Le lambda-calcul de Church, qui lui est équivalent, a influencé les langages de programmation fonctionnels.  
**[05:47]** En 1950, le test de Turing demande si une machine peut se faire passer pour un humain dans une conversation.  
**[05:55]** Il imagine aussi des machines qui apprennent de leur expérience, annonçant l'apprentissage automatique.  
**[06:01]** Le logo d'Apple serait un hommage à Turing : c'est une légende, démentie par son créateur.  
**[06:09]** La machine de Turing reste un concept théorique, mais ses idées influencent l'intelligence artificielle et la cybersécurité.  

## Chapitre 2 — Structure et fonctionnement  ·  06:17

**[06:17]** Chapitre 2 : structure et fonctionnement. Une machine de Turing lit et réécrit des symboles sur un ruban non borné. Elle a cinq composants.  
**[06:28]** Le ruban : une suite infinie de cases, à la fois entrée, mémoire et sortie. Les cases vides contiennent le blanc.  
**[06:37]** La tête de lecture et d'écriture lit une case, peut la remplacer, puis se déplace d'une case à gauche ou à droite.  
**[06:46]** L'ensemble des états, fini, est la seule mémoire hors du ruban, avec un état initial et des états d'arrêt.  
**[06:55]** L'alphabet d'entrée sigma contient les symboles du mot ; l'alphabet de ruban gamma y ajoute le blanc et des marques comme X et Y.  
**[07:05]** La fonction de transition est le programme : selon l'état et le symbole lu, elle donne le nouvel état, le symbole écrit et le déplacement.  
**[07:16]** Formellement, c'est un septuplet : Q, sigma, gamma, delta, l'état initial q zéro, le blanc B et les états finals F.  
**[07:25]** Delta associe à un état et à un symbole lu un nouvel état, un symbole à écrire et une direction.  
**[07:34]** Une configuration s'écrit u q v : le ruban contient u v, et la tête lit le premier symbole de v.  
**[07:43]** Dans le diagramme d'états, chaque état est un cercle, l'initial reçoit une flèche, les finals ont un double cercle.  
**[07:51]** Au départ, le mot est sur le ruban, la tête sur le premier symbole, la machine dans l'état initial.  
**[07:59]** À chaque étape, elle lit, consulte la transition, écrit, se déplace, change d'état, et recommence.  
**[08:06]** L'état initial est unique ; les états finals terminent un calcul réussi. On peut aussi utiliser deux états : accepter et rejeter.  
**[08:16]** Trois issues : l'acceptation dans un état final, le rejet ailleurs, ou le bouclage, sans jamais s'arrêter.  
**[08:23]** Un langage est décidable si une machine s'arrête sur toute entrée, récursivement énumérable si elle accepte exactement ses mots.  
**[08:32]** Exemple : reconnaître 0 puissance n, 1 puissance n. On remplace le premier 0 par X, le premier 1 par Y, on revient et on recommence.  
**[08:43]** Sur 0011, en 13 étapes, elle marque X et Y, puis encore X et Y, ne trouve plus que des Y, et atteint q4 : le mot est accepté.  
**[08:55]** Sur 001, dans l'état q1, elle lit un blanc sans transition définie : elle s'arrête hors état final, le mot est rejeté.  

## Chapitre 3 — Les différents types de machines de Turing  ·  09:06

**[09:06]** Chapitre 3 : les différents types. La machine déterministe n'a qu'une transition par état et symbole : un seul chemin de calcul.  
**[09:15]** La non déterministe peut en avoir plusieurs : le calcul devient un arbre, et le mot est accepté si un chemin accepte.  
**[09:25]** La machine à plusieurs bandes a une tête par ruban ; une machine à une bande la simule en temps au plus quadratique.  
**[09:35]** La machine à plusieurs têtes utilise plusieurs têtes sur un même ruban.  
**[09:40]** La machine universelle reçoit la description d'une machine M et un mot w, et simule son exécution : c'est le programme enregistré.  
**[09:50]** Exemples : une machine déterministe parcourt 00101 et accepte dès qu'elle trouve un 1.  
**[09:56]** Une machine à deux bandes copie 1011 du premier ruban sur le second.  
**[10:02]** Une machine à deux têtes compare le premier et le dernier symbole de A B C D C B A.  
**[10:11]** La machine universelle, avec la description d'une machine qui cherche un 1, accepte 1010 et rejette 0000.  
**[10:19]** Tous ces modèles ont la même puissance : une machine classique les simule. Seule l'efficacité change.  
**[10:26]** Simuler une machine non déterministe coûte un temps exponentiel connu : c'est l'origine de la question P contre NP.  

## Chapitre 4 — Machine de Turing et calculabilité  ·  10:36

**[10:36]** Chapitre 4 : la calculabilité. Un ordinateur peut-il résoudre n'importe quel problème ? Il faut d'abord définir précisément un algorithme.  
**[10:44]** Trois questions : que signifient calcul et algorithme ? Quels problèmes peut-on résoudre ? Et lesquels ne le seront jamais ?  
**[10:54]** La calculabilité cherche, pour un problème donné, une méthode qui donne la bonne réponse pour toutes les entrées.  
**[11:02]** La machine a quatre éléments : un ruban infini en cases, une tête de lecture et d'écriture, des états en nombre fini, et une table de transitions.  
**[11:13]** À chaque étape, dans l'état q, elle lit a, écrit b, se déplace et passe en q prime : delta de q, a égale q prime, b, D.  
**[11:25]** C'est un septuplet : Q, sigma, gamma, delta, q zéro, et les états d'arrêt q acceptation et q rejet.  
**[11:33]** Trois issues : elle accepte, elle rejette, ou elle boucle sans fin. Cette troisième issue rend la calculabilité subtile.  
**[11:42]** Une fonction f est calculable si une machine, pour toute entrée x, s'arrête avec f de x sur son ruban.  
**[11:50]** Selon la thèse de Church-Turing, tout calcul mécanique est faisable par une machine de Turing. C'est une thèse, pas un théorème.  
**[11:59]** Exemple : le successeur, f de n égale n plus 1, en unaire : 3 s'écrit 1 1 1.  
**[12:08]** Deux états suffisent : q zéro avance sur les 1 ; au premier blanc, elle écrit 1 et accepte.  
**[12:16]** Sur 3, la tête parcourt les trois 1, écrit un 1 sur le blanc et s'arrête : le ruban contient 1 1 1 1.  
**[12:26]** Elle s'arrête après n plus 1 étapes pour tout n : le successeur est calculable.  
**[12:33]** Un problème de décision attend oui ou non : 29 est-il premier ? 29 est une instance positive, 91 une instance négative.  
**[12:43]** Décidable : un algorithme s'arrête toujours avec la bonne réponse. Indécidable : aucun n'y parvient.  
**[12:50]** Semi-décidable : il répond oui sur les instances positives, mais peut ne jamais s'arrêter sur les négatives.  
**[12:57]** En intuition : décidable, on a toujours la réponse ; semi-décidable, un non peut se faire attendre à l'infini. L'arrêt est semi-décidable mais indécidable.  
**[13:07]** Chaque instance est codée par un mot : un entier en binaire, un graphe par sa matrice, une machine par sa table.  
**[13:17]** Un problème devient le langage de ses instances positives ; il est décidable si sa fonction caractéristique est calculable.  
**[13:25]** Primalité : pour d de 2 à racine de n, si d divise n, on répond non ; sinon, oui.  
**[13:34]** 29 : ni 2, ni 3, ni 4, ni 5 ne le divisent, il est premier. 91 : arrêt à 7, car 91 égale 7 fois 13.  
**[13:45]** Au plus racine de n moins une itérations, et toujours la bonne réponse : la primalité est décidable.  
**[13:53]** Pour l'arrêt, aucune borne n'existe : si la simulation dure, on ne sait pas si elle finira.  
**[14:01]** Si un problème est décidable, son complémentaire aussi : on échange oui et non. Union et intersection restent décidables.  
**[14:09]** Une réduction ramène A à B par une fonction calculable h : w est dans A si et seulement si h de w est dans B.  
**[14:20]** Si B est décidable, A l'est. Par contraposée, si A est indécidable, B l'est aussi : c'est la méthode standard.  
**[14:29]** Reconnaissable : une machine accepte les mots du langage, mais peut boucler sur les autres. Décidable : elle s'arrête toujours.  
**[14:38]** Tout langage décidable est reconnaissable, mais pas l'inverse.  
**[14:42]** L est décidable si et seulement si L et son complémentaire sont reconnaissables : on lance les deux reconnaisseurs en parallèle.  
**[14:51]** a n b n, a n b n c n et les mots pairs sont décidables ; A T M et HALT seulement reconnaissables ; le complémentaire de A T M, même pas.  
**[15:05]** Les décidables sont stables par toutes ces opérations ; les reconnaissables aussi, sauf par complémentaire.  
**[15:12]** Un algorithme, c'est une recette précise à suivre sans réfléchir. Pour Turing : une machine qui s'arrête sur toutes ses entrées.  
**[15:21]** Thèse de Church-Turing : tout ce qui est effectivement calculable l'est par une machine de Turing. Une thèse, car elle relie l'intuitif au formel.  
**[15:31]** Machine de Turing, lambda-calcul, fonctions récursives et langages modernes calculent exactement les mêmes fonctions.  
**[15:38]** Ses variantes ont le même pouvoir. Et la machine universelle simule n'importe quelle machine : le programme enregistré.  
**[15:46]** Le problème de l'arrêt : une machine M s'arrête-t-elle sur un mot w ? Existe-t-il un super-débogueur capable de le prédire ?  
**[15:55]** HALT est reconnaissable : on simule M sur w. Mais si M boucle, la simulation boucle aussi.  
**[16:03]** Supposons qu'un décideur H existe. On construit D, qui demande à H si une machine s'arrête sur son propre code, puis fait le contraire.  
**[16:13]** Sur son propre code, si D s'arrête, elle boucle ; si elle boucle, elle s'arrête. Contradiction : HALT est indécidable.  
**[16:22]** C'est le paradoxe du menteur, en version informatique.  
**[16:26]** Par réduction : M prime ignore son entrée, simule M sur w et accepte. M s'arrête sur w si et seulement si M prime accepte le mot vide.  
**[16:38]** Même langage, langage vide, terminaison sur toutes les entrées : autant de problèmes indécidables.  
**[16:44]** Aucun vérificateur universel n'existe, même si l'on peut prouver qu'un programme précis s'arrête.  
**[16:50]** Les machines sont dénombrables, les langages non, d'après Cantor : la plupart des langages n'ont aucune machine.  
**[16:58]** Théorème de Rice : toute propriété non triviale du langage reconnu est indécidable. Compter les états, lui, reste décidable.  
**[17:06]** Autres problèmes indécidables : la correspondance de Post, le dixième problème de Hilbert, l'équivalence de grammaires, le castor affairé.  
**[17:14]** Comme l'incomplétude de Gödel, ils reposent sur l'auto-référence.  
**[17:19]** Un problème décidable peut rester trop coûteux : c'est la complexité, avec P, NP et la question P égale NP.  
**[17:27]** Le modèle est théorique, et l'ordinateur quantique ne résout aucun problème indécidable, même s'il peut aller plus vite.  
**[17:35]** À retenir : la machine de Turing définit l'algorithme, l'arrêt est indécidable, et décidable ne veut pas dire faisable.  

## Chapitre 5 — Machine de Turing et théorie de la complexité  ·  17:45

**[17:45]** Chapitre 5 : la complexité. On ne demande plus si un problème est résoluble, mais à quel coût.  
**[17:53]** La complexité mesure le temps et la mémoire d'un algorithme selon la taille n de l'entrée.  
**[18:00]** La complexité temporelle, T de n, compte les étapes avant l'arrêt : linéaire, quadratique ou exponentielle.  
**[18:07]** La complexité spatiale, S de n, compte les cases utilisées : constante, linéaire ou quadratique.  
**[18:14]** Ce nombre d'étapes mesure le temps indépendamment du processeur et du langage.  
**[18:20]** La notation asymptotique décrit la croissance du coût : constante, logarithmique, linéaire ou quadratique.  
**[18:26]** Une recherche séquentielle examine jusqu'à n éléments : elle est en O de n.  
**[18:33]** La classe P regroupe les problèmes résolus en temps polynomial par une machine déterministe.  
**[18:39]** La classe NP, ceux dont une solution proposée se vérifie en temps polynomial.  
**[18:45]** PSPACE utilise une mémoire polynomiale, EXPTIME un temps exponentiel ; chaque classe est incluse dans la suivante.  
**[18:53]** P contre NP, c'est trouver contre vérifier. P est inclus dans NP, mais P égale NP reste un grand problème ouvert.  
**[19:02]** Le polynomial reste utilisable ; l'exponentiel, comme 2 puissance n, double à chaque élément ajouté.  
**[19:09]** Une réduction transforme A en B. Un problème NP-complet est dans NP, et tout NP s'y réduit : Cook et Levin le montrent pour SAT en 1971.  
**[19:20]** La machine de Turing est l'étalon : le temps et l'espace y ont une définition précise.  
**[19:27]** La complexité dit quels problèmes se résolvent efficacement, et où sont les limites des algorithmes.  

## Chapitre 6 — Applications et exemples pratiques  ·  19:36

**[19:36]** Chapitre 6 : applications. Simuler une machine, c'est un tableau pour le ruban, un pointeur pour la tête, une table et une boucle.  
**[19:46]** Exemple 1 : un nombre pair de 1. Deux états, pair et impair : chaque 1 change d'état, chaque 0 ne change rien.  
**[19:55]** Sur 1 0 1 1, elle finit dans l'état impair : le mot est rejeté.  
**[20:02]** Exemple 2 : le palindrome. Effacer le premier symbole, vérifier le dernier, l'effacer, revenir, jusqu'au mot vide.  
**[20:10]** Sur 10101, elle efface les 1, puis les 0, et lit le 1 central : accepté.  
**[20:17]** Exemple 3 : l'incrémentation binaire. Au dernier bit, un 0 devient 1 ; un 1 devient 0 et la retenue part à gauche.  
**[20:27]** 1011 devient 1100, et 111 devient 1000 : la retenue crée un nouveau bit.  
**[20:33]** Un simulateur charge la table, écrit le mot et exécute la machine pas à pas.  
**[20:40]** Le nombre pair de 1 se décide en n plus 1 étapes : un temps linéaire.  
**[20:47]** Le palindrome est quadratique sur une bande, selon Hennie en 1965, linéaire sur deux. L'incrémentation prend au plus 2 n plus 2 étapes.  
**[20:57]** Aucune n'utilise plus de mémoire que l'entrée, à une case près : l'espace est en O de n.  

## Chapitre 7 — Avantages, limites et perspectives  ·  21:07

**[21:07]** Chapitre 7. Premier avantage : un modèle simple et précis, où chaque étape suit une règle bien définie.  
**[21:15]** Elle définit la calculabilité : un problème est calculable si une machine le résout en un nombre fini d'étapes.  
**[21:23]** Sa version universelle exécute différents programmes.  
**[21:27]** Elle mesure la complexité, en temps et en espace, indépendamment du matériel.  
**[21:32]** Limites : une mémoire infinie, quand celle d'un ordinateur est finie, et des problèmes sans solution, comme l'arrêt.  
**[21:40]** Calculable ne veut pas dire pratique, et elle ne modélise pas les systèmes interactifs comme les réseaux.  
**[21:48]** Elle est abstraite, à ruban infini parcouru case par case ; l'ordinateur est physique, à mémoire finie, en accès direct.  
**[21:57]** Pourtant, ils font les mêmes calculs ; seules changent la mémoire, la vitesse et les ressources.  
**[22:04]** Son influence : les ordinateurs programmables, l'algorithmique, les langages de programmation.  
**[22:09]** En recherche, elle reste la référence, avec la question ouverte P égale NP.  
**[22:15]** Perspectives : algorithmes plus efficaces, calcul parallèle, informatique quantique, qui ne supprime pas ces limites, et intelligence artificielle.  

## Conclusion générale  ·  22:24


### Résumé des points essentiels

**[22:24]** Ce projet a présenté la machine de Turing de son origine historique jusqu’à ses applications. Née en **1936** pour répondre au problème de la décision de Hilbert, elle se compose d’un **ruban**, d’une **tête de lecture et d’écriture**, d’un ensemble fini d’**états** et d’une **fonction de transition**. Ses variantes (déterministe, non déterministe, à plusieurs bandes, à plusieurs têtes et universelle) ont toutes la même puissance de calcul, mais pas la même efficacité. Nous avons ensuite étudié la calculabilité et le problème de l’arrêt, puis la complexité et les classes P, NP, PSPACE et EXPTIME, avant de simuler trois machines et d’analyser leur complexité.  

### Réponse à la problématique

**[23:07]** Nous nous demandions comment un modèle aussi simple peut définir ce qu’un ordinateur peut calculer, et en combien de temps. La réponse tient en deux points. D’une part, la machine de Turing capture l’essence de tout calcul mécanique : selon la thèse de Church-Turing, **ce qu’elle ne peut pas calculer, aucun ordinateur ne le peut**, et des problèmes comme celui de l’arrêt sont définitivement hors de portée. D’autre part, son nombre d’étapes et son nombre de cases utilisées fournissent une mesure du temps et de l’espace **indépendante de la technologie**, ce qui permet de comparer rigoureusement les algorithmes.  

### Importance de la machine de Turing dans la complexité

**[23:47]** C’est grâce à la machine de Turing que le temps et l’espace de calcul ont une définition précise. Elle sert d’étalon pour définir les classes de complexité, comparer les problèmes par des réductions et formuler la question **P = NP**, ouverte depuis plus de cinquante ans et considérée comme l’un des grands défis des mathématiques.  

### Perspectives et ouverture

**[24:13]** La machine de Turing représente l’un des modèles les plus importants de l’histoire de l’informatique théorique. Malgré son caractère abstrait et certaines limites, elle reste un outil essentiel pour comprendre les fondements de l’informatique et orienter les recherches vers de nouveaux modèles de calcul : calcul parallèle et distribué, informatique quantique et intelligence artificielle. Près de quatre-vingt-dix ans après sa naissance, la question posée par Turing, « que peut faire une machine ? », reste au cœur de l’informatique.  
