# Projet : la machine de Turing — texte à lire sur la vidéo

Vidéo tirée du rapport « Projet_Machine_de_Turing » : elle suit le rapport point par point, de l'introduction générale à la conclusion générale. Durée : 20:07.
Chaque phrase commence au minutage indiqué ; le rythme prévu est celui d'une lecture à voix haute un peu soutenue (environ 165 mots par minute).
Au début de chaque chapitre, un écran titre s'affiche environ deux secondes : tu peux commencer la phrase dessus.
La vidéo n'a pas de musique, seulement des bruitages discrets aux changements de scène.
Photos d'Alan Turing, de David Hilbert et de Kurt Gödel : Wikimedia Commons.


## Introduction générale  ·  00:01

**[00:01]** Une bande, une tête qui lit et écrit, et quelques règles. Cette machine imaginaire définit ce que tout ordinateur peut calculer.  
**[00:09]** Ce projet présente la machine de Turing, le modèle qui donne un sens précis au mot « calcul », de la calculabilité à la complexité.  
**[00:19]** En 1936, avant les ordinateurs, le jeune mathématicien anglais Alan Turing l'imagine pour répondre à une question mathématique.  
**[00:27]** Au début du XXe siècle, on veut fonder les mathématiques sur des bases parfaitement sûres.  
**[00:33]** En 1928, David Hilbert demande s'il existe une méthode mécanique pour décider si un énoncé est démontrable : le problème de la décision.  
**[00:43]** En 1931, Kurt Gödel montre que tout système assez riche contient des énoncés vrais mais indémontrables.  
**[00:50]** En 1936, Church avec le lambda-calcul et Turing avec sa machine répondent à Hilbert : aucune méthode mécanique générale n'existe.  
**[00:58]** Problématique : comment un modèle aussi simple peut-il définir ce qu'un ordinateur peut calculer, et en combien de temps ?  
**[01:06]** Objectifs : retracer son histoire, décrire son fonctionnement, comparer ses types, étudier calculabilité et complexité, et la simuler.  
**[01:14]** Le travail suit sept chapitres, de l'histoire de la machine à ses limites et perspectives, puis la conclusion.  

## Chapitre 1 — Généralités et historique  ·  01:23

**[01:23]** Chapitre 1. Alan Mathison Turing naît le 23 juin 1912 à Londres. Très tôt, il montre un génie pour les mathématiques et les sciences.  
**[01:33]** Élève jugé brouillon, il est marqué par la mort de son ami Christopher Morcom en 1930, qui renforce sa détermination.  
**[01:41]** En 1931, il entre au King's College de Cambridge, publie son article fondateur en 1936, puis prépare un doctorat à Princeton avec Alonzo Church.  
**[01:51]** Pendant la guerre, à Bletchley Park, il conçoit avec Gordon Welchman la Bombe, qui déchiffre les messages de la machine Enigma.  
**[02:00]** Le calculateur Colossus, de Tommy Flowers, s'attaque lui au chiffre de la machine Lorenz.  
**[02:06]** Après la guerre, il conçoit l'ACE. Condamné en 1952 pour son homosexualité, il meurt en 1954, à 41 ans. Il est réhabilité en 2013.  
**[02:15]** La machine naît d'une question de Hilbert : existe-t-il une méthode mécanique pour décider si un énoncé est démontrable ?  
**[02:24]** En 1936, dans son article sur les nombres calculables, Turing doit d'abord définir ce qu'est une méthode mécanique : la machine de Turing est née.  
**[02:34]** Définition : c'est un modèle abstrait qui exécute un algorithme, en lisant et écrivant des symboles sur un ruban infini, selon un nombre fini de règles.  
**[02:44]** La thèse de Church-Turing affirme qu'elle résout tout problème algorithmique. Indémontrable, elle n'a jamais été contredite.  
**[02:51]** Turing imite un humain qui calcule sur papier : regarder un symbole, l'écrire ou l'effacer, se déplacer, changer d'état d'esprit.  
**[03:00]** Il inverse la question : au lieu d'une méthode par problème, une seule machine pour tout algorithme.  
**[03:07]** Elle définit rigoureusement l'algorithme et prouve que certains problèmes n'ont aucune solution mécanique : la réponse à Hilbert est non.  
**[03:15]** Elle inspire le programme enregistré, l'architecture de von Neumann et nos ordinateurs. Un langage est Turing-complet s'il peut la simuler.  
**[03:23]** Bien que rudimentaire, elle a la même puissance que n'importe quel ordinateur, avec assez de mémoire et de temps.  
**[03:31]** Le lambda-calcul de Church, qui lui est équivalent, a influencé les langages de programmation fonctionnels.  
**[03:38]** En 1950, le test de Turing demande si une machine peut se faire passer pour un humain dans une conversation.  
**[03:46]** Il imagine aussi des machines qui apprennent de leur expérience, annonçant l'apprentissage automatique.  
**[03:52]** Le logo d'Apple serait un hommage à Turing : c'est une légende, démentie par son créateur.  
**[03:59]** La machine de Turing reste un concept théorique, mais ses idées influencent l'intelligence artificielle et la cybersécurité.  

## Chapitre 2 — Structure et fonctionnement  ·  04:08

**[04:08]** Chapitre 2 : structure et fonctionnement. Une machine de Turing lit et réécrit des symboles sur un ruban non borné. Elle a cinq composants.  
**[04:17]** Le ruban : une suite infinie de cases, à la fois entrée, mémoire et sortie. Les cases vides contiennent le blanc.  
**[04:26]** La tête de lecture et d'écriture lit une case, peut la remplacer, puis se déplace d'une case à gauche ou à droite.  
**[04:35]** L'ensemble des états, fini, est la seule mémoire hors du ruban, avec un état initial et des états d'arrêt.  
**[04:43]** L'alphabet d'entrée sigma contient les symboles du mot ; l'alphabet de ruban gamma y ajoute le blanc et des marques comme X et Y.  
**[04:53]** La fonction de transition est le programme : selon l'état et le symbole lu, elle donne le nouvel état, le symbole écrit et le déplacement.  
**[05:03]** Formellement, c'est un septuplet : Q, sigma, gamma, delta, l'état initial q zéro, le blanc B et les états finals F.  
**[05:12]** Delta associe à un état et à un symbole lu un nouvel état, un symbole à écrire et une direction.  
**[05:20]** Une configuration s'écrit u q v : le ruban contient u v, et la tête lit le premier symbole de v.  
**[05:29]** Dans le diagramme d'états, chaque état est un cercle, l'initial reçoit une flèche, les finals ont un double cercle.  
**[05:37]** Au départ, le mot est sur le ruban, la tête sur le premier symbole, la machine dans l'état initial.  
**[05:45]** À chaque étape, elle lit, consulte la transition, écrit, se déplace, change d'état, et recommence.  
**[05:51]** L'état initial est unique ; les états finals terminent un calcul réussi. On peut aussi utiliser deux états : accepter et rejeter.  
**[06:00]** Trois issues : l'acceptation dans un état final, le rejet ailleurs, ou le bouclage, sans jamais s'arrêter.  
**[06:07]** Un langage est décidable si une machine s'arrête sur toute entrée, récursivement énumérable si elle accepte exactement ses mots.  
**[06:15]** Exemple : reconnaître 0 puissance n, 1 puissance n. On remplace le premier 0 par X, le premier 1 par Y, on revient et on recommence.  
**[06:26]** Sur 0011, en 13 étapes, elle marque X et Y, puis encore X et Y, ne trouve plus que des Y, et atteint q4 : le mot est accepté.  
**[06:37]** Sur 001, dans l'état q1, elle lit un blanc sans transition définie : elle s'arrête hors état final, le mot est rejeté.  

## Chapitre 3 — Les différents types de machines de Turing  ·  06:48

**[06:48]** Chapitre 3 : les différents types. La machine déterministe n'a qu'une transition par état et symbole : un seul chemin de calcul.  
**[06:57]** La non déterministe peut en avoir plusieurs : le calcul devient un arbre, et le mot est accepté si un chemin accepte.  
**[07:06]** La machine à plusieurs bandes a une tête par ruban ; une machine à une bande la simule en temps au plus quadratique.  
**[07:15]** La machine à plusieurs têtes utilise plusieurs têtes sur un même ruban.  
**[07:21]** La machine universelle reçoit la description d'une machine M et un mot w, et simule son exécution : c'est le programme enregistré.  
**[07:30]** Exemples : une machine déterministe parcourt 00101 et accepte dès qu'elle trouve un 1.  
**[07:36]** Une machine à deux bandes copie 1011 du premier ruban sur le second.  
**[07:42]** Une machine à deux têtes compare le premier et le dernier symbole de A B C D C B A.  
**[07:50]** La machine universelle, avec la description d'une machine qui cherche un 1, accepte 1010 et rejette 0000.  
**[07:57]** Tous ces modèles ont la même puissance : une machine classique les simule. Seule l'efficacité change.  
**[08:04]** Simuler une machine non déterministe coûte un temps exponentiel connu : c'est l'origine de la question P contre NP.  

## Chapitre 4 — Machine de Turing et calculabilité  ·  08:14

**[08:14]** Chapitre 4 : la calculabilité. Un ordinateur peut-il résoudre n'importe quel problème ? Il faut d'abord définir précisément un algorithme.  
**[08:22]** Trois questions : que signifient calcul et algorithme ? Quels problèmes peut-on résoudre ? Et lesquels ne le seront jamais ?  
**[08:31]** La calculabilité cherche, pour un problème donné, une méthode qui donne la bonne réponse pour toutes les entrées.  
**[08:38]** La machine a quatre éléments : un ruban infini en cases, une tête de lecture et d'écriture, des états en nombre fini, et une table de transitions.  
**[08:49]** À chaque étape, dans l'état q, elle lit a, écrit b, se déplace et passe en q prime : delta de q, a égale q prime, b, D.  
**[09:00]** C'est un septuplet : Q, sigma, gamma, delta, q zéro, et les états d'arrêt q acceptation et q rejet.  
**[09:08]** Trois issues : elle accepte, elle rejette, ou elle boucle sans fin. Cette troisième issue rend la calculabilité subtile.  
**[09:16]** Une fonction f est calculable si une machine, pour toute entrée x, s'arrête avec f de x sur son ruban.  
**[09:24]** Selon la thèse de Church-Turing, tout calcul mécanique est faisable par une machine de Turing. C'est une thèse, pas un théorème.  
**[09:33]** Exemple : le successeur, f de n égale n plus 1, en unaire : 3 s'écrit 1 1 1.  
**[09:41]** Deux états suffisent : q zéro avance sur les 1 ; au premier blanc, elle écrit 1 et accepte.  
**[09:49]** Sur 3, la tête parcourt les trois 1, écrit un 1 sur le blanc et s'arrête : le ruban contient 1 1 1 1.  
**[09:59]** Elle s'arrête après n plus 1 étapes pour tout n : le successeur est calculable.  
**[10:05]** Un problème de décision attend oui ou non : 29 est-il premier ? 29 est une instance positive, 91 une instance négative.  
**[10:14]** Décidable : un algorithme s'arrête toujours avec la bonne réponse. Indécidable : aucun n'y parvient.  
**[10:21]** Semi-décidable : il répond oui sur les instances positives, mais peut ne jamais s'arrêter sur les négatives.  
**[10:28]** En intuition : décidable, on a toujours la réponse ; semi-décidable, un non peut se faire attendre à l'infini. L'arrêt est semi-décidable mais indécidable.  
**[10:38]** Chaque instance est codée par un mot : un entier en binaire, un graphe par sa matrice, une machine par sa table.  
**[10:47]** Un problème devient le langage de ses instances positives ; il est décidable si sa fonction caractéristique est calculable.  
**[10:55]** Primalité : pour d de 2 à racine de n, si d divise n, on répond non ; sinon, oui.  
**[11:03]** 29 : ni 2, ni 3, ni 4, ni 5 ne le divisent, il est premier. 91 : arrêt à 7, car 91 égale 7 fois 13.  
**[11:14]** Au plus racine de n moins une itérations, et toujours la bonne réponse : la primalité est décidable.  
**[11:22]** Pour l'arrêt, aucune borne n'existe : si la simulation dure, on ne sait pas si elle finira.  
**[11:29]** Si un problème est décidable, son complémentaire aussi : on échange oui et non. Union et intersection restent décidables.  
**[11:37]** Une réduction ramène A à B par une fonction calculable h : w est dans A si et seulement si h de w est dans B.  
**[11:47]** Si B est décidable, A l'est. Par contraposée, si A est indécidable, B l'est aussi : c'est la méthode standard.  
**[11:56]** Reconnaissable : une machine accepte les mots du langage, mais peut boucler sur les autres. Décidable : elle s'arrête toujours.  
**[12:04]** Tout langage décidable est reconnaissable, mais pas l'inverse.  
**[12:08]** L est décidable si et seulement si L et son complémentaire sont reconnaissables : on lance les deux reconnaisseurs en parallèle.  
**[12:17]** a n b n, a n b n c n et les mots pairs sont décidables ; A T M et HALT seulement reconnaissables ; le complémentaire de A T M, même pas.  
**[12:30]** Les décidables sont stables par toutes ces opérations ; les reconnaissables aussi, sauf par complémentaire.  
**[12:36]** Un algorithme, c'est une recette précise à suivre sans réfléchir. Pour Turing : une machine qui s'arrête sur toutes ses entrées.  
**[12:45]** Thèse de Church-Turing : tout ce qui est effectivement calculable l'est par une machine de Turing. Une thèse, car elle relie l'intuitif au formel.  
**[12:55]** Machine de Turing, lambda-calcul, fonctions récursives et langages modernes calculent exactement les mêmes fonctions.  
**[13:01]** Ses variantes ont le même pouvoir. Et la machine universelle simule n'importe quelle machine : le programme enregistré.  
**[13:08]** Le problème de l'arrêt : une machine M s'arrête-t-elle sur un mot w ? Existe-t-il un super-débogueur capable de le prédire ?  
**[13:17]** HALT est reconnaissable : on simule M sur w. Mais si M boucle, la simulation boucle aussi.  
**[13:25]** Supposons qu'un décideur H existe. On construit D, qui demande à H si une machine s'arrête sur son propre code, puis fait le contraire.  
**[13:35]** Sur son propre code, si D s'arrête, elle boucle ; si elle boucle, elle s'arrête. Contradiction : HALT est indécidable.  
**[13:43]** C'est le paradoxe du menteur, en version informatique.  
**[13:47]** Par réduction : M prime ignore son entrée, simule M sur w et accepte. M s'arrête sur w si et seulement si M prime accepte le mot vide.  
**[13:58]** Même langage, langage vide, terminaison sur toutes les entrées : autant de problèmes indécidables.  
**[14:04]** Aucun vérificateur universel n'existe, même si l'on peut prouver qu'un programme précis s'arrête.  
**[14:10]** Les machines sont dénombrables, les langages non, d'après Cantor : la plupart des langages n'ont aucune machine.  
**[14:17]** Théorème de Rice : toute propriété non triviale du langage reconnu est indécidable. Compter les états, lui, reste décidable.  
**[14:25]** Autres problèmes indécidables : la correspondance de Post, le dixième problème de Hilbert, l'équivalence de grammaires, le castor affairé.  
**[14:33]** Comme l'incomplétude de Gödel, ils reposent sur l'auto-référence.  
**[14:37]** Un problème décidable peut rester trop coûteux : c'est la complexité, avec P, NP et la question P égale NP.  
**[14:45]** Le modèle est théorique, et l'ordinateur quantique ne résout aucun problème indécidable, même s'il peut aller plus vite.  
**[14:53]** À retenir : la machine de Turing définit l'algorithme, l'arrêt est indécidable, et décidable ne veut pas dire faisable.  

## Chapitre 5 — Machine de Turing et théorie de la complexité  ·  15:02

**[15:02]** Chapitre 5 : la complexité. On ne demande plus si un problème est résoluble, mais à quel coût.  
**[15:10]** La complexité mesure le temps et la mémoire d'un algorithme selon la taille n de l'entrée.  
**[15:17]** La complexité temporelle, T de n, compte les étapes avant l'arrêt : linéaire, quadratique ou exponentielle.  
**[15:24]** La complexité spatiale, S de n, compte les cases utilisées : constante, linéaire ou quadratique.  
**[15:30]** Ce nombre d'étapes mesure le temps indépendamment du processeur et du langage.  
**[15:36]** La notation asymptotique décrit la croissance du coût : constante, logarithmique, linéaire ou quadratique.  
**[15:42]** Une recherche séquentielle examine jusqu'à n éléments : elle est en O de n.  
**[15:48]** La classe P regroupe les problèmes résolus en temps polynomial par une machine déterministe.  
**[15:54]** La classe NP, ceux dont une solution proposée se vérifie en temps polynomial.  
**[16:00]** PSPACE utilise une mémoire polynomiale, EXPTIME un temps exponentiel ; chaque classe est incluse dans la suivante.  
**[16:07]** P contre NP, c'est trouver contre vérifier. P est inclus dans NP, mais P égale NP reste un grand problème ouvert.  
**[16:16]** Le polynomial reste utilisable ; l'exponentiel, comme 2 puissance n, double à chaque élément ajouté.  
**[16:22]** Une réduction transforme A en B. Un problème NP-complet est dans NP, et tout NP s'y réduit : Cook et Levin le montrent pour SAT en 1971.  
**[16:33]** La machine de Turing est l'étalon : le temps et l'espace y ont une définition précise.  
**[16:40]** La complexité dit quels problèmes se résolvent efficacement, et où sont les limites des algorithmes.  

## Chapitre 6 — Applications et exemples pratiques  ·  16:48

**[16:48]** Chapitre 6 : applications. Simuler une machine, c'est un tableau pour le ruban, un pointeur pour la tête, une table et une boucle.  
**[16:57]** Exemple 1 : un nombre pair de 1. Deux états, pair et impair : chaque 1 change d'état, chaque 0 ne change rien.  
**[17:07]** Sur 1 0 1 1, elle finit dans l'état impair : le mot est rejeté.  
**[17:13]** Exemple 2 : le palindrome. Effacer le premier symbole, vérifier le dernier, l'effacer, revenir, jusqu'au mot vide.  
**[17:20]** Sur 10101, elle efface les 1, puis les 0, et lit le 1 central : accepté.  
**[17:27]** Exemple 3 : l'incrémentation binaire. Au dernier bit, un 0 devient 1 ; un 1 devient 0 et la retenue part à gauche.  
**[17:37]** 1011 devient 1100, et 111 devient 1000 : la retenue crée un nouveau bit.  
**[17:43]** Un simulateur charge la table, écrit le mot et exécute la machine pas à pas.  
**[17:49]** Le nombre pair de 1 se décide en n plus 1 étapes : un temps linéaire.  
**[17:56]** Le palindrome est quadratique sur une bande, selon Hennie en 1965, linéaire sur deux. L'incrémentation prend au plus 2 n plus 2 étapes.  
**[18:06]** Aucune n'utilise plus de mémoire que l'entrée, à une case près : l'espace est en O de n.  

## Chapitre 7 — Avantages, limites et perspectives  ·  18:15

**[18:15]** Chapitre 7. Premier avantage : un modèle simple et précis, où chaque étape suit une règle bien définie.  
**[18:22]** Elle définit la calculabilité : un problème est calculable si une machine le résout en un nombre fini d'étapes.  
**[18:30]** Sa version universelle exécute différents programmes.  
**[18:33]** Elle mesure la complexité, en temps et en espace, indépendamment du matériel.  
**[18:39]** Limites : une mémoire infinie, quand celle d'un ordinateur est finie, et des problèmes sans solution, comme l'arrêt.  
**[18:46]** Calculable ne veut pas dire pratique, et elle ne modélise pas les systèmes interactifs comme les réseaux.  
**[18:54]** Elle est abstraite, à ruban infini parcouru case par case ; l'ordinateur est physique, à mémoire finie, en accès direct.  
**[19:02]** Pourtant, ils font les mêmes calculs ; seules changent la mémoire, la vitesse et les ressources.  
**[19:09]** Son influence : les ordinateurs programmables, l'algorithmique, les langages de programmation.  
**[19:14]** En recherche, elle reste la référence, avec la question ouverte P égale NP.  
**[19:20]** Perspectives : algorithmes plus efficaces, calcul parallèle, informatique quantique, qui ne supprime pas ces limites, et intelligence artificielle.  

## Conclusion générale  ·  19:29

**[19:29]** Pour conclure : un ruban, une tête, des états et une fonction de transition. Ses variantes ont la même puissance, pas la même efficacité.  
**[19:38]** Ce modèle simple suffit car il capture l'essence du calcul : ce qu'il ne peut pas faire, aucun ordinateur ne le peut.  
**[19:47]** En complexité, il définit le temps et l'espace, et donne leur sens à P, à NP et à P égale NP.  
**[19:56]** Une question ouverte depuis plus de cinquante ans. Et tout a commencé avec un ruban, une tête et quelques règles.  
