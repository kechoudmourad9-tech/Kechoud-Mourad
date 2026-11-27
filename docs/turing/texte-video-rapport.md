# Projet : la machine de Turing — texte à lire sur la vidéo

Vidéo tirée du rapport « Projet_Machine_de_Turing » : elle suit le rapport point par point, de l'introduction générale à la conclusion générale. Durée : 23:26.
Chaque phrase commence au minutage indiqué ; le rythme prévu est celui d'une lecture posée à voix haute.
Au début de chaque chapitre, un écran titre s'affiche environ deux secondes : tu peux commencer la phrase dessus.


## Introduction générale  ·  00:01

**[00:01]** Une bande, une tête qui lit et qui écrit, et quelques règles. C'est tout. Et pourtant, cette machine imaginaire définit ce que n'importe quel ordinateur peut calculer.  
**[00:13]** Ce projet présente la machine de Turing : le modèle mathématique qui donne un sens précis au mot « calcul », de la calculabilité jusqu'à la théorie de la complexité.  
**[00:26]** En 1936, avant même l'existence des ordinateurs, un jeune mathématicien anglais, Alan Turing, imagine cette machine pour répondre à une question purement mathématique.  
**[00:36]** Au début du XXe siècle, les mathématiciens veulent fonder les mathématiques sur des bases parfaitement sûres.  
**[00:44]** En 1928, David Hilbert demande s'il existe une méthode mécanique capable de décider si n'importe quel énoncé logique est démontrable : c'est le problème de la décision.  
**[00:56]** En 1931, Kurt Gödel montre que tout système formel assez riche contient des énoncés vrais mais indémontrables.  
**[01:04]** En 1936, Alonzo Church avec le lambda-calcul, et Alan Turing avec sa machine, répondent indépendamment à Hilbert : il n'existe pas de méthode mécanique générale.  
**[01:15]** Notre problématique : comment un modèle aussi simple, composé d'un ruban, d'une tête et de quelques règles, peut-il définir ce qu'un ordinateur peut calculer, et en combien de temps ?  
**[01:28]** Nos objectifs : retracer son histoire, décrire sa structure et son fonctionnement, comparer ses différents types, étudier la calculabilité et la complexité, puis la voir fonctionner sur des exemples simulés.  
**[01:41]** Le travail est organisé en sept chapitres, de l'histoire de la machine jusqu'à ses avantages, ses limites et ses perspectives, avant la conclusion générale.  

## Chapitre 1 — Généralités et historique  ·  01:54

**[01:54]** Chapitre 1. Qui était Alan Turing ? Alan Mathison Turing est né le 23 juin 1912 à Londres. Très tôt, il montre un génie exceptionnel pour les mathématiques et les sciences.  
**[02:07]** Élève jugé brouillon, il est profondément marqué par la mort de son ami Christopher Morcom, en 1930, qui renforce sa détermination.  
**[02:17]** En 1931, il entre au King's College de Cambridge. En 1936, il publie son article fondateur, puis part préparer un doctorat à Princeton, sous la direction d'Alonzo Church.  
**[02:29]** Pendant la Seconde Guerre mondiale, il rejoint Bletchley Park dès 1939. Avec Gordon Welchman, il conçoit la Bombe, une machine électromécanique qui permet de déchiffrer les messages de la machine Enigma.  
**[02:43]** Le calculateur Colossus, conçu par l'ingénieur Tommy Flowers, s'attaque quant à lui à un autre chiffre allemand, celui de la machine Lorenz.  
**[02:53]** Après la guerre, il participe à la conception des premiers ordinateurs, comme l'ACE. Condamné en 1952 pour son homosexualité, il meurt empoisonné au cyanure le 7 juin 1954, à 41 ans. Il a été réhabilité en 2013.  
**[03:09]** La machine est née d'une question : en 1928, David Hilbert demande s'il existe une méthode mécanique capable de décider si n'importe quel énoncé est démontrable.  
**[03:20]** En 1936, dans son article sur les nombres calculables, Turing répond. Mais pour cela, il doit d'abord définir précisément ce qu'est une méthode mécanique. C'est la naissance de la machine de Turing.  
**[03:34]** Définition : une machine de Turing est un modèle abstrait d'automate qui exécute un algorithme. Elle lit et écrit des symboles sur un ruban infini, en suivant un nombre fini de règles.  
**[03:48]** La thèse de Church-Turing affirme qu'elle peut résoudre tout problème algorithmique. Cette thèse ne peut pas être démontrée, mais aucun contre-exemple n'a jamais été trouvé.  
**[04:00]** Pourquoi l'a-t-il inventée ? Pour imiter un humain qui calcule avec un crayon et du papier : regarder un symbole, l'écrire ou l'effacer, se déplacer, et changer d'état d'esprit.  
**[04:12]** Turing inverse ainsi la question de son époque : au lieu d'une méthode pour chaque problème, une seule machine capable d'exécuter tout algorithme.  
**[04:23]** Son importance est immense : elle donne une définition rigoureuse de l'algorithme, et elle prouve que certains problèmes n'ont aucune solution mécanique. La réponse à Hilbert est donc non.  
**[04:36]** Elle a ensuite inspiré l'idée du programme enregistré, l'architecture de von Neumann, puis tous nos ordinateurs. Aujourd'hui encore, un langage est dit Turing-complet s'il peut simuler cette machine.  
**[04:48]** Bien que rudimentaire, elle a la même puissance de calcul que n'importe quel ordinateur, à condition de disposer d'assez de mémoire et de temps.  
**[04:59]** Le lambda-calcul de Church, qui lui est équivalent, a influencé les langages de programmation, en particulier les langages fonctionnels.  
**[05:08]** En 1950, Turing propose le test de Turing : une machine peut-elle se faire passer pour un humain au cours d'une conversation ?  
**[05:18]** Dans le même article, il imagine des machines capables d'apprendre de leur expérience : une idée qui annonce l'apprentissage automatique.  
**[05:27]** On raconte souvent que le logo d'Apple serait un hommage à Turing. C'est une légende, démentie par le créateur du logo.  
**[05:37]** La machine de Turing reste un concept théorique, et non une machine physique. Mais ses idées influencent toujours l'intelligence artificielle et la cybersécurité.  

## Chapitre 2 — Structure et fonctionnement  ·  05:49

**[05:49]** Chapitre 2 : structure et fonctionnement. Une machine de Turing est un contrôle fini qui lit et réécrit des symboles sur un ruban non borné. Elle repose sur cinq composants fondamentaux.  
**[06:02]** D'abord, le ruban : une suite infinie de cases, qui sert à la fois d'entrée, de mémoire de travail et de sortie. Les cases non utilisées contiennent le symbole blanc.  
**[06:15]** Ensuite, la tête de lecture et d'écriture. Elle pointe une seule case : elle lit le symbole, peut le remplacer, puis se déplace d'une case vers la gauche ou vers la droite.  
**[06:29]** Troisième composant : l'ensemble des états. C'est la seule mémoire de la machine en dehors du ruban. Il est fini, et contient un état initial et des états d'arrêt.  
**[06:42]** Quatrième : l'alphabet. L'alphabet d'entrée sigma contient les symboles du mot. L'alphabet de ruban gamma contient en plus le blanc, et d'éventuels symboles de marquage, comme X et Y.  
**[06:55]** Enfin, la fonction de transition, le programme de la machine. Selon l'état courant et le symbole lu, elle donne le nouvel état, le symbole à écrire, et le sens du déplacement.  
**[07:09]** Mathématiquement, une machine de Turing est un septuplet : les états Q, l'alphabet d'entrée sigma, l'alphabet de ruban gamma, la fonction delta, l'état initial q zéro, le blanc B, et l'ensemble F des états finals.  
**[07:24]** La fonction delta associe, à un état et à un symbole lu, un nouvel état, un symbole à écrire, et une direction : gauche ou droite.  
**[07:35]** Une configuration s'écrit u q v : le ruban contient u v, la machine est dans l'état q, et la tête lit le premier symbole de v. Une étape de calcul se note avec le symbole ⊢.  
**[07:51]** On la représente par un diagramme d'états : chaque état est un cercle, l'état initial reçoit une flèche, les états finals ont un double cercle, et chaque transition est notée : lu, flèche, écrit, direction.  
**[08:07]** Le fonctionnement est simple. Au départ, le mot est écrit sur le ruban, la tête est sur le symbole le plus à gauche, et la machine est dans l'état initial.  
**[08:20]** À chaque étape, elle lit le symbole, consulte la fonction de transition, écrit, se déplace, et change d'état. Puis elle recommence.  
**[08:29]** L'état initial est unique : c'est là que tout commence. Les états finals sont ceux où s'arrête un calcul réussi. Certains auteurs utilisent deux états d'arrêt : accepter et rejeter.  
**[08:43]** Il y a trois issues possibles : l'acceptation, quand la machine atteint un état final ; le rejet, quand elle s'arrête ailleurs ; et le bouclage, quand elle ne s'arrête jamais.  
**[08:56]** Un langage est dit récursif, ou décidable, si une machine s'arrête sur toute entrée. Il est récursivement énumérable si une machine accepte exactement ses mots.  
**[09:07]** Exemple : une machine qui reconnaît les mots 0 puissance n, 1 puissance n. Elle remplace le premier 0 par X, va chercher le premier 1 et le remplace par Y, puis revient, et recommence.  
**[09:23]** Sur le mot 0011, il lui faut 13 étapes : elle marque X, Y, puis X, Y, vérifie qu'il ne reste que des Y, et atteint l'état q4. Le mot est accepté.  
**[09:37]** Sur 001 en revanche, elle lit un blanc dans l'état q1, où aucune transition n'est définie. Elle s'arrête dans un état non final : le mot est rejeté.  

## Chapitre 3 — Les différents types de machines de Turing  ·  09:50

**[09:50]** Chapitre 3 : les différents types. D'abord, la machine déterministe : pour chaque état et chaque symbole lu, une seule transition est prévue. Le calcul suit un chemin unique.  
**[10:03]** La machine non déterministe peut avoir plusieurs transitions pour un même état et un même symbole. Le calcul devient un arbre, et le mot est accepté si au moins un chemin mène à l'acceptation.  
**[10:18]** La machine à plusieurs bandes possède plusieurs rubans, chacun avec sa propre tête. Elle est plus pratique, et une machine à une seule bande peut la simuler, avec un temps au plus quadratique.  
**[10:32]** La machine à plusieurs têtes, elle, utilise plusieurs têtes sur un seul et même ruban, qui lisent et écrivent à des positions différentes.  
**[10:43]** Et la plus importante : la machine universelle. Elle reçoit la description d'une machine M et un mot w, puis simule son exécution. C'est l'idée du programme enregistré.  
**[10:55]** Quelques exemples. Une machine déterministe parcourt le mot 00101, et accepte dès qu'elle trouve un 1, avec une seule règle à chaque étape.  
**[11:06]** Une machine à deux bandes copie le mot 1011 : la première tête lit le premier ruban, la deuxième écrit les mêmes symboles sur le second.  
**[11:17]** Une machine à deux têtes lit à la fois le premier et le dernier symbole de A B C D C B A, et peut les comparer directement.  
**[11:30]** Enfin, la machine universelle, à qui l'on donne la description d'une machine qui cherche un 1, accepte 1010 et rejette 0000, exactement comme elle.  
**[11:40]** En comparaison, tous ces modèles ont exactement la même puissance de calcul : chacun peut être simulé par une machine classique. Ce qui change, c'est l'efficacité.  
**[11:52]** La simulation connue d'une machine non déterministe par une machine déterministe coûte un temps exponentiel. C'est là que naît la question P contre NP.  

## Chapitre 4 — Machine de Turing et calculabilité  ·  12:04

**[12:04]** Chapitre 4 : la calculabilité. Une fonction est calculable s'il existe une machine de Turing qui, pour toute entrée, s'arrête après un nombre fini d'étapes avec le bon résultat.  
**[12:17]** L'addition, le tri d'une liste ou la recherche d'un chemin sont calculables. La calculabilité trace la frontière entre ce qu'un ordinateur peut faire en principe, et ce qu'il ne pourra jamais faire.  
**[12:31]** Un problème de décision attend une réponse oui ou non. Il est décidable si une machine répond toujours correctement, en s'arrêtant à chaque fois. Sinon, il est indécidable.  
**[12:43]** Sont décidables : savoir si un nombre est premier, si un mot est de la forme 0 puissance n, 1 puissance n, ou si un automate fini accepte un mot.  
**[12:57]** Sont indécidables : le problème de l'arrêt, savoir si deux programmes calculent la même fonction, ou le dixième problème de Hilbert, sur les équations à solutions entières, résolu par Matiiassevitch en 1970.  
**[13:11]** Un langage est reconnaissable si une machine accepte tous ses mots, mais peut boucler sur les autres. Il est décidable si la machine s'arrête toujours. Tout langage décidable est donc reconnaissable.  
**[13:24]** Un langage est décidable si et seulement si lui-même et son complémentaire sont reconnaissables. Et certains langages ne sont même pas reconnaissables, car il y a bien plus de langages que de machines.  
**[13:39]** Selon la thèse de Church-Turing, tout ce qui est calculable par un algorithme est calculable par une machine de Turing. Un algorithme, c'est une machine de Turing qui s'arrête toujours.  
**[13:52]** Le lambda-calcul de Church et les fonctions récursives de Gödel et Kleene se sont révélés exactement équivalents à la machine de Turing, ce qui renforce la thèse.  
**[14:04]** Le problème de l'arrêt demande : étant donné un programme et une entrée, ce programme va-t-il s'arrêter ? Turing prouve en 1936 qu'aucune machine ne peut répondre correctement dans tous les cas.  
**[14:18]** Supposons qu'une machine H le décide. On construit une machine D qui fait l'inverse de ce que prédit H sur elle-même. Si D s'arrête, elle boucle. Si elle boucle, elle s'arrête. Contradiction : H n'existe pas.  
**[14:33]** Ce raisonnement, dit de diagonalisation, s'inspire de Cantor et de Gödel. Le problème de l'arrêt est reconnaissable, mais pas décidable.  
**[14:43]** Le théorème de Rice va plus loin : toute propriété non triviale du comportement d'un programme est indécidable. Aucun outil ne pourra détecter toutes les boucles infinies.  
**[14:55]** C'est une limite fondamentale : ce qu'une machine de Turing ne peut pas calculer, aucun ordinateur ne le peut, même avec un temps et une mémoire illimités.  
**[15:07]** S'y ajoutent des limites pratiques : un problème décidable peut demander tant de temps ou de mémoire que sa résolution devient irréaliste. C'est l'objet du chapitre suivant.  

## Chapitre 5 — Machine de Turing et théorie de la complexité  ·  15:20

**[15:20]** Chapitre 5 : la complexité. On ne demande plus seulement si un problème est résoluble, mais à quel coût.  
**[15:29]** La complexité algorithmique mesure les ressources utilisées par un algorithme, le temps et la mémoire, en fonction de la taille n de l'entrée.  
**[15:39]** La complexité temporelle, T de n, est le nombre d'étapes effectuées avant l'arrêt. Les ordres de grandeur courants sont linéaire, quadratique et exponentiel.  
**[15:50]** La complexité spatiale, S de n, est le nombre de cases du ruban utilisées pendant le calcul : constant, linéaire ou quadratique.  
**[16:00]** Ce nombre d'étapes est une mesure abstraite du temps d'exécution : il ne dépend ni du processeur, ni du langage, mais seulement de l'algorithme.  
**[16:10]** La notation asymptotique décrit l'évolution du coût quand l'entrée grandit : temps constant, logarithmique, linéaire ou quadratique.  
**[16:18]** Par exemple, une recherche séquentielle dans une liste de n éléments examine jusqu'à n éléments : son coût est en O de n.  
**[16:29]** On range alors les problèmes en classes. La classe P contient les problèmes résolus en temps polynomial par une machine déterministe.  
**[16:38]** La classe NP contient les problèmes dont une solution proposée se vérifie en temps polynomial.  
**[16:46]** PSPACE contient les problèmes résolus avec une mémoire polynomiale, et EXPTIME ceux résolus en temps exponentiel. Chaque classe est incluse dans la suivante.  
**[16:56]** La différence entre P et NP, c'est trouver contre vérifier. Tout problème de P est dans NP, mais personne ne sait si P est égal à NP : c'est un grand problème ouvert.  
**[17:10]** Un temps polynomial reste utilisable quand n grandit. Un temps exponentiel, comme 2 puissance n, devient vite impraticable : chaque élément de plus peut doubler le temps.  
**[17:22]** Une réduction transforme un problème A en un problème B : savoir résoudre B permet de résoudre A. Un problème est NP-complet s'il est dans NP, et si tout problème de NP s'y réduit. Le théorème de Cook-Levin, en 1971, montre que SAT est NP-complet.  
**[17:42]** La machine de Turing est l'étalon de toute cette théorie : grâce à elle, le temps et l'espace ont une définition précise, indépendante de la technologie.  
**[17:53]** En résumé, la théorie de la complexité permet de savoir quels problèmes peuvent être résolus efficacement, et quelles sont les limites des algorithmes.  

## Chapitre 6 — Applications et exemples pratiques  ·  18:05

**[18:05]** Chapitre 6 : les applications. Simuler une machine de Turing, c'est reproduire son fonctionnement avec un programme : une bande en tableau, une tête en pointeur, une table de transitions, et une boucle d'exécution.  
**[18:20]** Premier exemple : reconnaître un mot contenant un nombre pair de 1. Deux états suffisent, pair et impair. Chaque 1 fait changer d'état, et chaque 0 ne change rien.  
**[18:33]** Sur le mot 1, 0, 1, 1 : pair, impair, impair, pair, impair. Au blanc, la machine est dans l'état impair. Le mot est rejeté.  
**[18:44]** Deuxième exemple : reconnaître un palindrome. La machine efface le premier symbole, court jusqu'au dernier, vérifie qu'il est identique, l'efface, puis revient. Elle recommence jusqu'à ce que le mot soit vide.  
**[18:57]** Sur 10101, elle efface les deux 1 des extrémités, puis les deux 0, et lit enfin le 1 central, seul : le mot est accepté.  
**[19:09]** Troisième exemple : l'incrémentation binaire. La machine va jusqu'au dernier bit. Si c'est un 0, elle écrit 1 et s'arrête. Si c'est un 1, elle écrit 0 et reporte la retenue vers la gauche.  
**[19:23]** Ainsi, 1011, c'est-à-dire 11, devient 1100, c'est-à-dire 12. Et si tous les bits valent 1, comme 111, la retenue crée un nouveau bit : 1000.  
**[19:35]** Un simulateur permet de charger la table de transitions, d'écrire le mot sur la bande, puis d'exécuter la machine pas à pas, en voyant la tête, l'état et la bande.  
**[19:48]** Analyse : le nombre pair de 1 se décide en un seul passage, en exactement n plus 1 étapes : un temps linéaire.  
**[19:58]** Le palindrome demande des allers-retours : un temps quadratique sur une bande, comme l'a démontré Hennie en 1965. Avec deux bandes, il devient linéaire. L'incrémentation, elle, prend au plus 2 n plus 2 étapes.  
**[20:13]** Aucune de ces machines n'utilise plus de mémoire que l'entrée elle-même, à une case près pour la retenue : l'espace reste en O de n.  

## Chapitre 7 — Avantages, limites et perspectives  ·  20:26

**[20:26]** Chapitre 7 : avantages, limites et perspectives. Premier avantage : c'est un modèle simple et précis, qui décrit chaque étape d'un algorithme par des règles bien définies.  
**[20:38]** Elle définit la calculabilité : un problème est calculable s'il existe une machine de Turing qui le résout en un nombre fini d'étapes.  
**[20:48]** Sa version universelle peut simuler n'importe quelle autre machine : une même machine peut exécuter différents programmes.  
**[20:56]** Elle permet de mesurer la complexité, en temps et en espace, et c'est un modèle indépendant de tout matériel.  
**[21:05]** Ses limites : sa mémoire est théoriquement infinie, alors que celle d'un ordinateur est limitée. Et le problème de l'arrêt montre que certains problèmes n'ont aucune solution.  
**[21:17]** Un problème calculable n'est pas forcément pratique à résoudre : il faut distinguer calculabilité et complexité. Enfin, elle ne modélise pas directement les systèmes interactifs, comme les réseaux ou le temps réel.  
**[21:31]** Face à un ordinateur réel : la machine de Turing est un modèle abstrait, à ruban infini, qui parcourt les cases une par une. L'ordinateur est physique, à mémoire finie, et accède directement à n'importe quelle adresse.  
**[21:47]** Pourtant, ils réalisent les mêmes types de calculs. La différence porte sur les conditions pratiques : la mémoire, la vitesse et les ressources.  
**[21:57]** Son influence est partout : les ordinateurs programmables, la conception des algorithmes, la théorie des langages de programmation.  
**[22:06]** En recherche, elle reste la référence pour la calculabilité et la complexité, avec la grande question ouverte : P est-il égal à NP ?  
**[22:16]** Ses perspectives : améliorer l'efficacité des algorithmes, étudier le calcul parallèle et distribué, l'informatique quantique, qui ne supprime pas les limites de la calculabilité, et les fondements de l'intelligence artificielle.  

## Conclusion générale  ·  22:31

**[22:31]** Pour conclure : une machine de Turing, c'est un ruban, une tête, des états, et une fonction de transition. Ses variantes ont toutes la même puissance, mais pas la même efficacité.  
**[22:45]** Notre réponse à la problématique : ce modèle simple suffit, parce qu'il capture l'essence du calcul mécanique. Ce qu'il ne peut pas faire, aucun ordinateur ne peut le faire.  
**[22:57]** En complexité, c'est l'outil qui définit le temps et l'espace, et qui donne un sens précis aux classes P et NP, et à la question : P est-il égal à NP ?  
**[23:11]** Cette question, ouverte depuis plus de cinquante ans, reste l'un des grands défis des mathématiques. Et tout a commencé avec un ruban, une tête, et quelques règles.  
