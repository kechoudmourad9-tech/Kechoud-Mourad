# Projet : la machine de Turing — texte à lire sur la vidéo

Vidéo tirée du rapport « Projet_Machine_de_Turing » : elle suit le rapport point par point, de l'introduction générale à la conclusion générale. Durée : 31:46.
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

**[12:04]** Chapitre 4 : machine de Turing et calculabilité. Un ordinateur exécute des algorithmes, mais peut-il résoudre n'importe quel problème ? Pour répondre, il faut d'abord dire précisément ce qu'est un algorithme.  
**[12:18]** Ce chapitre répond à trois questions. Que signifient calcul et algorithme ? Quels problèmes peut-on résoudre par un algorithme ? Et existe-t-il des problèmes qu'aucun algorithme ne pourra jamais résoudre ?  
**[12:31]** La calculabilité étudie les problèmes que l'on peut résoudre par un algorithme. Sa question centrale : pour un problème donné, existe-t-il une méthode qui donne la bonne réponse pour toutes les entrées possibles ?  
**[12:46]** Une machine de Turing a quatre éléments : un ruban infini découpé en cases, une tête de lecture et d'écriture, un nombre fini d'états qui servent de mémoire, et une table de transitions qui joue le rôle de programme.  
**[13:03]** À chaque étape, dans l'état q, la machine lit le symbole a, écrit un symbole b, déplace la tête à gauche ou à droite, et passe dans l'état q prime. On note : delta de q, a égale q prime, b, D.  
**[13:21]** Formellement, c'est un septuplet : les états Q, l'alphabet d'entrée sigma, l'alphabet du ruban gamma, la fonction de transition delta, l'état initial q zéro, et les deux états d'arrêt, q acceptation et q rejet.  
**[13:36]** Trois issues sont possibles : elle atteint q acceptation, elle accepte ; elle atteint q rejet, elle rejette ; ou elle n'atteint jamais aucun des deux : elle boucle. C'est cette troisième issue qui rend la calculabilité subtile.  
**[13:52]** Une fonction f est calculable s'il existe une machine de Turing qui, pour toute entrée x, s'arrête en laissant le résultat f de x sur son ruban, en un nombre fini d'étapes.  
**[14:06]** D'après la thèse de Church-Turing, tout ce qu'une procédure mécanique peut calculer, une machine de Turing le peut aussi. Ce n'est pas un théorème : la notion de procédure mécanique reste intuitive.  
**[14:20]** Exemple : la fonction successeur, f de n égale n plus 1. On écrit n en notation unaire, avec n symboles 1 : 3 s'écrit 1 1 1, et 0 s'écrit avec le mot vide.  
**[14:35]** Deux états suffisent. Dans l'état q zéro, la tête lit un 1, le laisse et avance. À la première case blanche, elle écrit un 1 et passe dans l'état d'acceptation.  
**[14:49]** Sur n égale 3, la tête parcourt les trois 1, atteint le blanc à l'étape 3, écrit un 1, et s'arrête à l'étape 4. Le ruban contient 1 1 1 1 : c'est bien 4.  
**[15:04]** La machine s'arrête après exactement n plus 1 étapes, pour tout entier n, même pour 0. La fonction successeur est donc calculable.  
**[15:14]** Un problème de décision attend une réponse oui ou non, par exemple : cet entier est-il premier ? Une instance est une donnée concrète : 29 est une instance positive, 91 une instance négative.  
**[15:29]** Un problème est décidable s'il existe un algorithme qui s'arrête sur toute instance et donne toujours la bonne réponse. Il est indécidable si aucun algorithme n'y parvient.  
**[15:41]** Il est semi-décidable si un algorithme répond oui sur toutes les instances positives, mais peut ne jamais s'arrêter sur certaines instances négatives.  
**[15:51]** En intuition : décidable, on obtient toujours la réponse. Semi-décidable : si c'est oui, on finit par le savoir ; si c'est non, on peut attendre indéfiniment. Le problème de l'arrêt est semi-décidable, mais indécidable.  
**[16:06]** Pour une machine de Turing, chaque instance est codée par un mot : un entier par son écriture binaire, un graphe par sa matrice d'adjacence, une machine par sa table de transitions.  
**[16:20]** Un problème P devient alors un langage : L P, l'ensemble de ses instances positives. P est décidable si sa fonction caractéristique, qui vaut 1 sur L P et 0 ailleurs, est calculable.  
**[16:34]** Exemple : la primalité. Pour d allant de 2 à la racine de n, si d divise n, on répond non et on s'arrête. Si aucun d ne divise n, on répond oui.  
**[16:49]** Pour 29, on teste 2, 3, 4 et 5 : aucun ne divise 29, il est premier. Pour 91, le test s'arrête à 7, car 91 égale 7 fois 13.  
**[17:02]** La boucle fait au plus racine de n moins une itérations : un nombre fini, connu à l'avance. Et la réponse est toujours correcte : la primalité est décidable.  
**[17:15]** Le problème de l'arrêt est différent. Pour un programme quelconque, aucune borne sur le nombre d'étapes n'est connue : si la simulation dure longtemps, on ne sait pas si elle finira un jour.  
**[17:29]** Propriétés utiles : si un problème est décidable, son complémentaire l'est aussi, il suffit d'échanger oui et non. L'union et l'intersection de deux problèmes décidables sont décidables.  
**[17:41]** Une réduction ramène un problème A à un problème B, grâce à une fonction calculable h : w est dans A si et seulement si h de w est dans B.  
**[17:55]** Si B est décidable, A l'est aussi : on calcule h de w, puis on lance le décideur de B. Par contraposée, si A est indécidable, B l'est aussi : c'est la méthode standard.  
**[18:09]** Un langage est reconnaissable si une machine accepte ses mots, mais peut rejeter ou boucler sur les autres. Il est décidable si la machine s'arrête toujours, en acceptant ou en rejetant.  
**[18:23]** Tout langage décidable est donc reconnaissable. Mais la réciproque est fausse : certains langages sont reconnaissables sans être décidables.  
**[18:32]** Théorème : L est décidable si et seulement si L et son complémentaire sont reconnaissables. On lance les deux reconnaisseurs en parallèle, étape par étape : l'un des deux finit forcément par accepter.  
**[18:46]** Exemples : a n b n, a n b n c n, et les mots de longueur paire sont décidables. A T M et HALT sont reconnaissables, mais pas décidables. Le complémentaire de A T M n'est même pas reconnaissable.  
**[19:03]** Les décidables sont stables par union, intersection, complémentaire, concaténation et étoile. Les reconnaissables aussi, sauf par complémentaire : sinon, HALT serait décidable.  
**[19:13]** Qu'est-ce qu'un algorithme ? Une suite finie d'instructions précises, comme une recette assez détaillée pour être suivie sans réfléchir. Dans le modèle de Turing, c'est une machine qui s'arrête sur toutes ses entrées.  
**[19:28]** La thèse de Church-Turing : tout ce qui est calculable par une procédure effective l'est par une machine de Turing. C'est une thèse, et non un théorème, car elle relie une notion intuitive à une notion formelle.  
**[19:44]** Elle est largement acceptée : la machine de Turing, le lambda-calcul de Church, les fonctions récursives de Gödel et Kleene, et nos langages de programmation calculent exactement les mêmes fonctions.  
**[19:57]** Les variantes, à plusieurs rubans, à ruban infini dans les deux sens, ou non déterministes, ont le même pouvoir de calcul. Et la machine universelle U simule n'importe quelle machine M sur un mot w : c'est le programme enregistré.  
**[20:14]** Le problème de l'arrêt. Entrée : une machine M et un mot w. Question : M s'arrête-t-elle sur w ? Autrement dit : existe-t-il un super-débogueur capable de le prédire pour n'importe quel programme ?  
**[20:29]** HALT est reconnaissable : une machine universelle simule M sur w, et accepte si la simulation s'arrête. Mais si M boucle, la simulation boucle aussi.  
**[20:41]** Preuve par l'absurde. Supposons qu'un décideur H existe. On construit D : sur le code d'une machine M, elle demande à H si M s'arrête sur son propre code, puis fait le contraire.  
**[20:55]** Lançons D sur son propre code. Si D s'arrête, H le prédit, donc D boucle. Si D boucle, H le prédit, donc D s'arrête. Contradiction dans les deux cas : H n'existe pas, HALT est indécidable.  
**[21:11]** C'est une version informatique du paradoxe du menteur : D contredit ce que H affirme à son sujet.  
**[21:19]** Par réduction, d'autres problèmes tombent. Une machine accepte-t-elle le mot vide ? À M et w, on associe M prime, qui ignore son entrée, simule M sur w, puis accepte. M s'arrête sur w si et seulement si M prime accepte le mot vide.  
**[21:38]** De même, savoir si deux machines reconnaissent le même langage, si un langage reconnu est vide, ou si un programme termine sur toutes les entrées, est indécidable.  
**[21:50]** Il n'existe donc aucun vérificateur universel de terminaison. Mais on peut prouver qu'un programme précis s'arrête : l'indécidabilité concerne le cas général.  
**[22:00]** Les limites. Les machines de Turing sont dénombrables, car chacune s'écrit comme un mot fini. Les langages, eux, ne le sont pas, d'après Cantor. La plupart des langages ne sont reconnus par aucune machine.  
**[22:15]** Le théorème de Rice : toute propriété non triviale du langage reconnu par une machine est indécidable, comme : L de M est vide. Une propriété du code, comme avoir plus de dix états, reste décidable.  
**[22:30]** Autres problèmes indécidables : la correspondance de Post, le dixième problème de Hilbert, résolu par Matiyasevich en 1970, l'équivalence de deux grammaires, et le castor affairé, une fonction non calculable.  
**[22:43]** Comme l'incomplétude de Gödel en 1931, ces résultats reposent sur l'auto-référence : un énoncé, ou une machine, qui parle de lui-même.  
**[22:53]** Limites pratiques : un problème décidable peut rester trop coûteux à résoudre. C'est l'objet de la complexité, avec les classes P et NP, et la question ouverte : P est-il égal à NP ?  
**[23:08]** Enfin, le modèle est théorique : ruban infini, aucune contrainte physique. Et l'ordinateur quantique ne dépasse pas ces limites : il ne résout aucun problème indécidable, même s'il pourrait aller plus vite.  
**[23:22]** À retenir : la machine de Turing définit l'algorithme. Décidable, un algorithme répond toujours ; semi-décidable, il confirme les oui. Le problème de l'arrêt est indécidable, et les réductions et le théorème de Rice en révèlent bien d'autres.  

## Chapitre 5 — Machine de Turing et théorie de la complexité  ·  23:40

**[23:40]** Chapitre 5 : la complexité. On ne demande plus seulement si un problème est résoluble, mais à quel coût.  
**[23:48]** La complexité algorithmique mesure les ressources utilisées par un algorithme, le temps et la mémoire, en fonction de la taille n de l'entrée.  
**[23:59]** La complexité temporelle, T de n, est le nombre d'étapes effectuées avant l'arrêt. Les ordres de grandeur courants sont linéaire, quadratique et exponentiel.  
**[24:09]** La complexité spatiale, S de n, est le nombre de cases du ruban utilisées pendant le calcul : constant, linéaire ou quadratique.  
**[24:19]** Ce nombre d'étapes est une mesure abstraite du temps d'exécution : il ne dépend ni du processeur, ni du langage, mais seulement de l'algorithme.  
**[24:30]** La notation asymptotique décrit l'évolution du coût quand l'entrée grandit : temps constant, logarithmique, linéaire ou quadratique.  
**[24:38]** Par exemple, une recherche séquentielle dans une liste de n éléments examine jusqu'à n éléments : son coût est en O de n.  
**[24:48]** On range alors les problèmes en classes. La classe P contient les problèmes résolus en temps polynomial par une machine déterministe.  
**[24:58]** La classe NP contient les problèmes dont une solution proposée se vérifie en temps polynomial.  
**[25:05]** PSPACE contient les problèmes résolus avec une mémoire polynomiale, et EXPTIME ceux résolus en temps exponentiel. Chaque classe est incluse dans la suivante.  
**[25:16]** La différence entre P et NP, c'est trouver contre vérifier. Tout problème de P est dans NP, mais personne ne sait si P est égal à NP : c'est un grand problème ouvert.  
**[25:30]** Un temps polynomial reste utilisable quand n grandit. Un temps exponentiel, comme 2 puissance n, devient vite impraticable : chaque élément de plus peut doubler le temps.  
**[25:42]** Une réduction transforme un problème A en un problème B : savoir résoudre B permet de résoudre A. Un problème est NP-complet s'il est dans NP, et si tout problème de NP s'y réduit. Le théorème de Cook-Levin, en 1971, montre que SAT est NP-complet.  
**[26:01]** La machine de Turing est l'étalon de toute cette théorie : grâce à elle, le temps et l'espace ont une définition précise, indépendante de la technologie.  
**[26:13]** En résumé, la théorie de la complexité permet de savoir quels problèmes peuvent être résolus efficacement, et quelles sont les limites des algorithmes.  

## Chapitre 6 — Applications et exemples pratiques  ·  26:25

**[26:25]** Chapitre 6 : les applications. Simuler une machine de Turing, c'est reproduire son fonctionnement avec un programme : une bande en tableau, une tête en pointeur, une table de transitions, et une boucle d'exécution.  
**[26:39]** Premier exemple : reconnaître un mot contenant un nombre pair de 1. Deux états suffisent, pair et impair. Chaque 1 fait changer d'état, et chaque 0 ne change rien.  
**[26:52]** Sur le mot 1, 0, 1, 1 : pair, impair, impair, pair, impair. Au blanc, la machine est dans l'état impair. Le mot est rejeté.  
**[27:03]** Deuxième exemple : reconnaître un palindrome. La machine efface le premier symbole, court jusqu'au dernier, vérifie qu'il est identique, l'efface, puis revient. Elle recommence jusqu'à ce que le mot soit vide.  
**[27:17]** Sur 10101, elle efface les deux 1 des extrémités, puis les deux 0, et lit enfin le 1 central, seul : le mot est accepté.  
**[27:28]** Troisième exemple : l'incrémentation binaire. La machine va jusqu'au dernier bit. Si c'est un 0, elle écrit 1 et s'arrête. Si c'est un 1, elle écrit 0 et reporte la retenue vers la gauche.  
**[27:43]** Ainsi, 1011, c'est-à-dire 11, devient 1100, c'est-à-dire 12. Et si tous les bits valent 1, comme 111, la retenue crée un nouveau bit : 1000.  
**[27:54]** Un simulateur permet de charger la table de transitions, d'écrire le mot sur la bande, puis d'exécuter la machine pas à pas, en voyant la tête, l'état et la bande.  
**[28:07]** Analyse : le nombre pair de 1 se décide en un seul passage, en exactement n plus 1 étapes : un temps linéaire.  
**[28:18]** Le palindrome demande des allers-retours : un temps quadratique sur une bande, comme l'a démontré Hennie en 1965. Avec deux bandes, il devient linéaire. L'incrémentation, elle, prend au plus 2 n plus 2 étapes.  
**[28:33]** Aucune de ces machines n'utilise plus de mémoire que l'entrée elle-même, à une case près pour la retenue : l'espace reste en O de n.  

## Chapitre 7 — Avantages, limites et perspectives  ·  28:45

**[28:45]** Chapitre 7 : avantages, limites et perspectives. Premier avantage : c'est un modèle simple et précis, qui décrit chaque étape d'un algorithme par des règles bien définies.  
**[28:57]** Elle définit la calculabilité : un problème est calculable s'il existe une machine de Turing qui le résout en un nombre fini d'étapes.  
**[29:08]** Sa version universelle peut simuler n'importe quelle autre machine : une même machine peut exécuter différents programmes.  
**[29:16]** Elle permet de mesurer la complexité, en temps et en espace, et c'est un modèle indépendant de tout matériel.  
**[29:24]** Ses limites : sa mémoire est théoriquement infinie, alors que celle d'un ordinateur est limitée. Et le problème de l'arrêt montre que certains problèmes n'ont aucune solution.  
**[29:36]** Un problème calculable n'est pas forcément pratique à résoudre : il faut distinguer calculabilité et complexité. Enfin, elle ne modélise pas directement les systèmes interactifs, comme les réseaux ou le temps réel.  
**[29:50]** Face à un ordinateur réel : la machine de Turing est un modèle abstrait, à ruban infini, qui parcourt les cases une par une. L'ordinateur est physique, à mémoire finie, et accède directement à n'importe quelle adresse.  
**[30:06]** Pourtant, ils réalisent les mêmes types de calculs. La différence porte sur les conditions pratiques : la mémoire, la vitesse et les ressources.  
**[30:17]** Son influence est partout : les ordinateurs programmables, la conception des algorithmes, la théorie des langages de programmation.  
**[30:25]** En recherche, elle reste la référence pour la calculabilité et la complexité, avec la grande question ouverte : P est-il égal à NP ?  
**[30:36]** Ses perspectives : améliorer l'efficacité des algorithmes, étudier le calcul parallèle et distribué, l'informatique quantique, qui ne supprime pas les limites de la calculabilité, et les fondements de l'intelligence artificielle.  

## Conclusion générale  ·  30:51

**[30:51]** Pour conclure : une machine de Turing, c'est un ruban, une tête, des états, et une fonction de transition. Ses variantes ont toutes la même puissance, mais pas la même efficacité.  
**[31:04]** Notre réponse à la problématique : ce modèle simple suffit, parce qu'il capture l'essence du calcul mécanique. Ce qu'il ne peut pas faire, aucun ordinateur ne peut le faire.  
**[31:17]** En complexité, c'est l'outil qui définit le temps et l'espace, et qui donne un sens précis aux classes P et NP, et à la question : P est-il égal à NP ?  
**[31:31]** Cette question, ouverte depuis plus de cinquante ans, reste l'un des grands défis des mathématiques. Et tout a commencé avec un ruban, une tête, et quelques règles.  
