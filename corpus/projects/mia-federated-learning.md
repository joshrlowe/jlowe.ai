---
slug: mia-federated-learning
title: Membership inference in federated learning
kind: project
role: Graduate Researcher
stack: [PyTorch, Flower, Opacus, Adversarial Robustness Toolbox]
outcomes:
  - Federated Wide ResNet 28-4 training on CIFAR-100, simulated across ten non-IID clients
  - Black-box membership inference attacks quantify what the trained model leaks
  - Differential privacy as a toggleable defense, so leakage is compared like-for-like
visibility: public
---

Federated learning keeps raw data on the device, but the trained model can
still betray who was in the training set. This graduate research project
(M.S. CS, University of Central Florida) builds the full loop — a Wide
ResNet 28-4 trained on CIFAR-100 with Flower across ten simulated clients
under a non-IID Dirichlet partition, then attacked with black-box membership
inference from the Adversarial Robustness Toolbox to measure that leakage
directly.

Differential privacy is the defense under evaluation. Opacus adds gradient
clipping and calibrated noise, toggled per run, and the attack model reports
accuracy, precision, recall, and F1 against held-out members and non-members.
Same architecture, same partitions, same attack either way — so any drop in
attack success is attributable to the privacy noise, not a changed setup.
